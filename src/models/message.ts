import { DYNAMODB_TABLE_PREFIX } from '@src/constants';
import { DynamoDB } from 'aws-sdk'; // eslint-disable-line no-unused-vars
import { putItem, query } from '@src/database';
import { urlSafeBase64Encode } from '@src/models/utils';
import { UserData } from '../services/messages/types'; // eslint-disable-line no-unused-vars

export interface DynamoDBMessageItem extends DynamoDB.PutItemInputAttributeMap {
  channelIds: { SS: string[] };
  content: { S: string };
  contentShort: { S: string };
  hash: { S: string };
  id: { S: string }; // sort key
  imageUrl: { S: string } | { NULL: boolean };
  populationParams: {
    M: { affiliations: { SS: string[] }; users: { SS: string[] } | { NULL: boolean } };
  };
  sendAt: { S: string }; // partition key
  status: { S: string };
  statusMessage: { S: string } | { NULL: boolean };
  title: { S: string };
}

export interface MessagePopulationParams {
  affiliations?: string[];
  users?: UserData[];
}

interface MessageParams {
  dynamoDbMessage?: AWS.DynamoDB.AttributeMap;
  message?: {
    channelIds: string[];
    content: string;
    contentShort: string;
    hash?: string;
    id?: string;
    imageUrl?: string;
    populationParams: MessagePopulationParams;
    sendAt: string;
    status: string;
    statusMessage?: string;
    title: string;
  };
}

export interface MessageStatus {
  id: string;
  sendAt: string;
  status: string;
  statusMessage?: string;
}

/* eslint-disable no-unused-vars */
export enum Status {
  ERROR = 'ERROR',
  NEW = 'NEW',
  PROCESSING = 'PROCESSING',
  CANCELLED = 'CANCELLED',
  SENT = 'SENT',
}
/* eslint-enable no-unused-vars */

class Message {
  channelIds: string[] = [];

  content: string = '';

  contentShort: string = '';

  hash: string = '';

  id?: string = '';

  imageUrl?: string = '';

  populationParams: MessagePopulationParams = {};

  sendAt: string = '';

  status: string = Status.NEW;

  statusMessage?: string = '';

  title: string = '';

  static TABLE_NAME: string = `${DYNAMODB_TABLE_PREFIX}-Messages`;

  static STATUS_INDEX_NAME: string = `${DYNAMODB_TABLE_PREFIX}-MessageStatuses`;

  static HASH_INDEX_NAME: string = `${DYNAMODB_TABLE_PREFIX}-MessageByHash`;

  static ID_INDEX_NAME: string = `${DYNAMODB_TABLE_PREFIX}-MessageId`;

  constructor(p: MessageParams) {
    if (p.message) {
      const {
        sendAt,
        hash,
        id,
        imageUrl,
        status,
        statusMessage,
        populationParams,
        channelIds,
        content,
        contentShort,
        title,
      } = p.message;
      this.sendAt = sendAt;
      this.id = id;
      this.imageUrl = imageUrl;
      this.status = status;
      this.statusMessage = statusMessage;
      this.populationParams = populationParams;
      this.channelIds = channelIds;
      this.content = content;
      this.contentShort = contentShort;
      this.title = title;
      this.hash =
        hash ??
        urlSafeBase64Encode({
          sendAt,
          title,
        });
    }

    if (p.dynamoDbMessage) {
      const {
        sendAt,
        id,
        imageUrl,
        hash,
        status,
        statusMessage,
        populationParams,
        channelIds,
        content,
        contentShort,
        title,
      } = p.dynamoDbMessage;
      if (sendAt) this.sendAt = sendAt.S || '';
      if (id) this.id = id.S || '';
      if (imageUrl) this.imageUrl = imageUrl.S || '';
      if (hash) this.hash = hash.S || '';
      if (status) this.status = status.S || '';
      if (statusMessage) this.statusMessage = statusMessage.S || '';
      if (channelIds) this.channelIds = channelIds.SS || [];
      if (content) this.content = content.S || '';
      if (contentShort) this.contentShort = contentShort.S || '';
      if (title) this.title = title.S || '';
      if (populationParams && populationParams.M) {
        const { affiliations, users } = populationParams.M;
        this.populationParams = {
          affiliations: affiliations.SS,
          users: users ? users.SS?.map((u) => JSON.parse(u)) : undefined,
        };
      }
    }
  }

  static updateStatus = async (
    props: Message,
    status: Status,
    statusMessage: string,
  ): Promise<Message | undefined> => {
    const message = props;
    message.status = status;
    message.statusMessage = statusMessage;
    return Message.upsert(message);
  };

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
      return Message.find(props.sendAt, props.id!);
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
      if (!results.Items?.length) return [];
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
      if (!results.Items?.length) return undefined;
      return new Message({ dynamoDbMessage: results.Items.shift() });
    } catch (err) {
      console.error(`Message.find(${sendAt}, ${id}) failed:`, err);
      throw err;
    }
  };

  static exists = async (props: Message): Promise<boolean> => {
    try {
      const params: AWS.DynamoDB.QueryInput = {
        TableName: Message.TABLE_NAME,
        IndexName: Message.HASH_INDEX_NAME,
        KeyConditionExpression: '#hashAttribute = :hashValue',
        ExpressionAttributeNames: {
          '#hashAttribute': 'hash',
        },
        ExpressionAttributeValues: {
          ':hashValue': { S: props.hash },
        },
        Select: 'COUNT',
      };
      const results: AWS.DynamoDB.QueryOutput = await query(params);
      return (results.Count ?? 0) > 0;
    } catch (err) {
      console.error(`Message.exists(${props}) failed:`, err);
      throw err;
    }
  };

  static findById = async (id: string): Promise<Message | undefined> => {
    try {
      const params: AWS.DynamoDB.QueryInput = {
        TableName: Message.TABLE_NAME,
        IndexName: Message.ID_INDEX_NAME,
        KeyConditionExpression: '#idAttribute = :idValue',
        ExpressionAttributeNames: {
          '#idAttribute': 'id',
        },
        ExpressionAttributeValues: {
          ':idValue': { S: id },
        },
        Select: 'ALL_ATTRIBUTES',
      };
      const results: AWS.DynamoDB.QueryOutput = await query(params);
      if (!results.Items?.length) return undefined;
      return new Message({ dynamoDbMessage: results.Items.shift() });
    } catch (err) {
      console.error(`Message.findById(${id}) failed:`, err);
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
      if (!results.Items?.length) return [];
      return results.Items.map((i) => ({
        id: i.id.S!,
        sendAt: i.sendAt.S!,
        status: i.status.S!,
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
    const {
      sendAt,
      id,
      imageUrl,
      hash,
      status,
      statusMessage,
      populationParams: { affiliations, users },
      channelIds,
      content,
      contentShort,
      title,
    } = props;
    return {
      sendAt: { S: sendAt },
      id: { S: id! },
      imageUrl: imageUrl ? { S: imageUrl } : { NULL: true },
      hash: { S: hash },
      status: { S: status },
      statusMessage: statusMessage ? { S: statusMessage } : { NULL: true },
      populationParams: {
        M: {
          affiliations: { SS: affiliations! },
          users: users ? { SS: users.map((u) => JSON.stringify(u)) } : { NULL: true },
        },
      },
      channelIds: { SS: channelIds },
      content: { S: content },
      contentShort: { S: contentShort },
      title: { S: title },
    };
  };
}

export default Message;
