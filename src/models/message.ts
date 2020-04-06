import { DYNAMODB_TABLE_PREFIX } from '../constants';
import { DynamoDB } from 'aws-sdk';
import { createTable, putItem, query } from '../database';

export interface DynamoDBMessageItem extends DynamoDB.PutItemInputAttributeMap {
  sendAt: { S: string }; // partition key
  id: { S: string }; // sort key
  status: { S: string };
  populationParams: { M: { affiliation: { S: string } } };
  channelIds: { SS: string[] };
  content: { S: string };
  contentShort: { S: string };
}

interface MessagePopulationParams {
  affiliation?: string;
}

interface MessageParams {
  message?: {
    sendAt: string;
    id: string;
    status: string;
    populationParams: MessagePopulationParams;
    channelIds: string[];
    content: string;
    contentShort: string;
  };
  dynamoDbMessage?: AWS.DynamoDB.AttributeMap;
}

class Message {
  sendAt: string = '';

  id: string = '';

  status: string = '';

  populationParams: MessagePopulationParams = {};

  channelIds: string[] = [];

  content: string = '';

  contentShort: string = '';

  static TABLE_NAME: string = `${DYNAMODB_TABLE_PREFIX}Messages`;

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
  /**
   * Translate the TrendingResource properties into the properly shaped data as an Item for
   * Dynamodb.
   * @param props - the properties to translate to a dynamodb item
   * @returns DynamoDbTrendingResourceItem - the Item for use in Dynamodb
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

  /**
   * Create the table in DynamoDb for local development
   */
  static createTable = () => {
    createTable({
      AttributeDefinitions: [
        { AttributeName: 'sendAt', AttributeType: 'S' },
        { AttributeName: 'id', AttributeType: 'S' },
      ],
      KeySchema: [
        { AttributeName: 'sendAt', KeyType: 'HASH' },
        { AttributeName: 'id', KeyType: 'RANGE' },
      ],
      ProvisionedThroughput: {
        ReadCapacityUnits: 5,
        WriteCapacityUnits: 5,
      },
      TableName: Message.TABLE_NAME,
      StreamSpecification: {
        StreamEnabled: false,
      },
    })
      .then((v) => console.log(v))
      .catch((err) => console.error(err));
  };
}

export default Message;