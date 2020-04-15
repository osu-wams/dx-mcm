import { DYNAMODB_TABLE_PREFIX } from '@src/constants';
import { DynamoDB } from 'aws-sdk'; // eslint-disable-line no-unused-vars
import { putItem, query } from '@src/database';

export interface DynamoDBMessageItem extends DynamoDB.PutItemInputAttributeMap {
  channelIds: { SS: string[] };
  content: { S: string };
  contentShort: { S: string };
  id: { S: string }; // sort key
  populationParams: { M: { affiliation: { S: string } } };
  sendAt: { S: string }; // partition key
  status: { S: string };
}

interface MessagePopulationParams {
  affiliation?: string;
}

interface MessageParams {
  dynamoDbMessage?: AWS.DynamoDB.AttributeMap;
  message?: {
    channelIds: string[];
    content: string;
    contentShort: string;
    id: string;
    populationParams: MessagePopulationParams;
    sendAt: string;
    status: string;
  };
}

export interface MessageStatus {
  id: string;
  sendAt: string;
  status: string;
}

/* eslint-disable no-unused-vars */
export enum Status {
  NEW = 'NEW',
  SENT = 'SENT',
}
/* eslint-enable no-unused-vars */

class Message {
  channelIds: string[] = [];

  content: string = '';

  contentShort: string = '';

  id: string = '';

  populationParams: MessagePopulationParams = {};

  sendAt: string = '';

  status: string = Status.NEW;

  static TABLE_NAME: string = `${DYNAMODB_TABLE_PREFIX}-Messages`;

  static STATUS_INDEX_NAME: string = `${DYNAMODB_TABLE_PREFIX}-MessageStatuses`;

  constructor(p: MessageParams) {
    if (p.message) {
      const { sendAt, id, status, populationParams, channelIds, content, contentShort } = p.message;
      this.sendAt = sendAt;
      this.id = id;
      this.status = status;
      this.populationParams = populationParams;
      this.channelIds = channelIds;
      this.content = content;
      this.contentShort = contentShort;
    }

    if (p.dynamoDbMessage) {
      const {
        sendAt,
        id,
        status,
        populationParams,
        channelIds,
        content,
        contentShort,
      } = p.dynamoDbMessage;
      if (sendAt) this.sendAt = sendAt.S || '';
      if (id) this.id = id.S || '';
      if (status) this.status = status.S || '';
      if (channelIds) this.channelIds = channelIds.SS || [];
      if (content) this.content = content.S || '';
      if (contentShort) this.contentShort = contentShort.S || '';
      if (populationParams && populationParams.M) {
        const { affiliation } = populationParams.M;
        this.populationParams = {
          affiliation: affiliation.S,
        };
      }
    }
  }

  static upsert = async (props: Message): Promise<Message | undefined> => {
    // ! DynamoDb only supports 'ALL_OLD' or 'NONE' for return values from the
    // ! putItem call, which means the only way to get values from ddb would be to
    // ! getItem with the key after having put the item successfully. The DX use
    // ! doesn't really seem like it needs to fetch the record after having created it
    // ! the first time.
    try {
      const params: AWS.DynamoDB.PutItemInput = {
        TableName: Message.TABLE_NAME,
        Item: Message.asDynamoDbItem(props),
        ReturnValues: 'NONE',
      };

      const result = await putItem(params);
      console.log('Message.upsert succeeded:', result);
      return Message.find(props.sendAt, props.id);
    } catch (err) {
      console.error(`Message.upsert failed:`, props, err);
      throw err;
    }
  };

  static findAll = async (sendAt: string): Promise<Message[] | null> => {
    try {
      const params: AWS.DynamoDB.QueryInput = {
        TableName: Message.TABLE_NAME,
        KeyConditionExpression: '#sendAtAttribute = :sendAtValue',
        ExpressionAttributeNames: {
          '#sendAtAttribute': 'sendAt',
        },
        ExpressionAttributeValues: {
          ':sendAtValue': { S: sendAt },
        },
        Select: 'ALL_ATTRIBUTES',
      };
      const results: AWS.DynamoDB.QueryOutput = await query(params);
      if (!results.Items) return [];
      return results.Items.map((i) => new Message({ dynamoDbMessage: i }));
    } catch (err) {
      console.error(`Message.findAll(${sendAt}) failed:`, err);
      throw err;
    }
  };

  static find = async (sendAt: string, id: string): Promise<Message | undefined> => {
    try {
      const params: AWS.DynamoDB.QueryInput = {
        TableName: Message.TABLE_NAME,
        KeyConditionExpression: '#sendAtAttribute = :sendAtValue AND #idAttribute = :idValue',
        ExpressionAttributeNames: {
          '#sendAtAttribute': 'sendAt',
          '#idAttribute': 'id',
        },
        ExpressionAttributeValues: {
          ':sendAtValue': { S: sendAt },
          ':idValue': { S: id },
        },
        Select: 'ALL_ATTRIBUTES',
      };
      const results: AWS.DynamoDB.QueryOutput = await query(params);
      if (!results.Items) return undefined;
      return new Message({ dynamoDbMessage: results.Items.shift() });
    } catch (err) {
      console.error(`Message.find(${sendAt}, ${id}) failed:`, err);
      throw err;
    }
  };

  static byStatusBeforeDate = async (status: Status, sendAt: string): Promise<MessageStatus[]> => {
    try {
      const params: AWS.DynamoDB.QueryInput = {
        TableName: Message.TABLE_NAME,
        IndexName: Message.STATUS_INDEX_NAME,
        KeyConditionExpression: '#keyAttribute = :keyValue AND #rangeAttribute <= :rangeValue',
        ExpressionAttributeNames: {
          '#keyAttribute': 'status',
          '#rangeAttribute': 'sendAt',
        },
        ExpressionAttributeValues: {
          ':keyValue': { S: status },
          ':rangeValue': { S: sendAt },
        },
        Select: 'ALL_PROJECTED_ATTRIBUTES',
      };
      const results: AWS.DynamoDB.QueryOutput = await query(params);
      if (!results.Items) return [];
      return results.Items.map((i) => ({
        id: i.id.S || '',
        sendAt: i.sendAt.S || '',
        status: i.status.S || '',
      }));
    } catch (err) {
      console.error(`Message.byStatusBeforeDate(${status}, ${sendAt}) failed:`, err);
      throw err;
    }
  };

  /**
   * Translate the properties into the properly shaped data as an Item for
   * Dynamodb.
   * @param props - the properties to translate to a dynamodb item
   * @returns - the Item for use in Dynamodb
   */
  static asDynamoDbItem = (props: Message): DynamoDBMessageItem => {
    return {
      sendAt: { S: props.sendAt },
      id: { S: props.id },
      status: { S: props.status },
      populationParams: {
        M: {
          affiliation: { S: props.populationParams.affiliation || '' },
        },
      },
      channelIds: { SS: props.channelIds },
      content: { S: props.content },
      contentShort: { S: props.contentShort },
    };
  };
}

export default Message;
