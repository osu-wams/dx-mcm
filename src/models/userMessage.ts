import { DYNAMODB_TABLE_PREFIX } from '@src/constants';
import { DynamoDB } from 'aws-sdk'; // eslint-disable-line no-unused-vars
import { putItem, updateItem, query } from '@src/database';
import { DashboardChannel, SmsChannel } from '@src/models/channels';
import type Channel from '@src/models/channels/channel'; // eslint-disable-line no-unused-vars
import { urlSafeBase64Encode, urlSafeBase64Decode } from './utils';

export interface DynamoDBUserMessageItem extends DynamoDB.PutItemInputAttributeMap {
  channelId: { S: string };
  channelSendAt: { S: string };
  channelMessageId: { S: string };
  content: { S: string };
  contentShort: { S: string };
  deliveredAt: { S: string } | { NULL: boolean };
  id: { S: string };
  messageId: { S: string };
  onid: { S: string } | { NULL: boolean };
  osuId: { S: string } | { NULL: boolean };
  sendAt: { S: string };
  smsNumber: { S: string } | { NULL: boolean };
  status: { S: string };
  statusSendAt: { S: string };
  title: { S: string };
}

interface UserMessageParams {
  dynamoDbUserMessage?: AWS.DynamoDB.AttributeMap;
  userMessage?: {
    channelId: string;
    content: string;
    contentShort: string;
    deliveredAt?: string;
    id: string;
    messageId: string;
    onid?: string;
    osuId?: string;
    sendAt: string;
    smsNumber?: string;
    status: string;
    title: string;
  };
}

export interface UserMessageResults {
  items: UserMessage[];
  count: number;
  lastKey?: string;
}

/* eslint-disable no-unused-vars */
export enum ChannelId {
  DASHBOARD = 'dashboard',
  SMS = 'sms',
}

export enum Status {
  NEW = 'NEW',
  READ = 'READ',
  PROCESSING = 'PROCESSING',
  ARCHIVED = 'ARCHIVED',
  DELETED = 'DELETED',
  DELIVERED = 'DELIVERED',
  ERROR = 'ERROR',
}
/* eslint-enable no-unused-vars */

/**
 * Get the channel class to process and deliver the UserMessage
 * @param userMessage the user message to process and deliver
 */
export const getChannel = (userMessage: UserMessage): Channel => {
  switch (userMessage.channelId.toLowerCase()) {
    case ChannelId.DASHBOARD:
      return new DashboardChannel(userMessage);
    case ChannelId.SMS:
      return new SmsChannel(userMessage);
    default:
      throw new Error(
        `Channel ${userMessage.channelId} not defined, unable to handle this channel.`,
      );
  }
};

export const channelExists = (userMessage: UserMessage): boolean =>
  ChannelId[userMessage.channelId.toUpperCase() as keyof typeof ChannelId] ===
  userMessage.channelId.toLowerCase();

export const compositeKey = (fields: string[], separator: string = ':'): string =>
  fields.join(separator);

class UserMessage {
  channelId: string = '';

  channelMessageId?: string;

  channelSendAt?: string;

  content: string = '';

  contentShort: string = '';

  deliveredAt?: string = '';

  id: string = '';

  messageId: string = '';

  onid?: string = '';

  osuId?: string = '';

  sendAt: string = '';

  smsNumber?: string = '';

  status: string = Status.NEW;

  statusSendAt?: string;

  title: string = '';

  static TABLE_NAME: string = `${DYNAMODB_TABLE_PREFIX}-UserMessages`;

  static STATUS_INDEX_NAME: string = `${DYNAMODB_TABLE_PREFIX}-UserMessageStatuses`;

  static ALL_BY_STATUS_INDEX_NAME: string = `${DYNAMODB_TABLE_PREFIX}-UserMessageAllByStatus`;

  static CHANNEL_INDEX_NAME: string = `${DYNAMODB_TABLE_PREFIX}-UserMessageByChannel`;

  static SEND_AT_INDEX_NAME: string = `${DYNAMODB_TABLE_PREFIX}-UserMessageBySendAt`;

  static COMPOSITE_KEY_NAME: string = 'channelMessageId';

  constructor(p: UserMessageParams) {
    if (p.userMessage) {
      const {
        channelId,
        content,
        contentShort,
        deliveredAt,
        id,
        messageId,
        onid,
        osuId,
        sendAt,
        smsNumber,
        status,
        title,
      } = p.userMessage;
      this.sendAt = sendAt;
      this.deliveredAt = deliveredAt;
      this.id = id;
      this.messageId = messageId;
      this.status = status;
      this.onid = onid;
      this.osuId = osuId;
      this.channelId = channelId;
      this.content = content;
      this.contentShort = contentShort;
      this.channelMessageId = compositeKey([this.channelId, this.messageId]);
      this.smsNumber = smsNumber;
      this.title = title;
      this.statusSendAt = compositeKey([this.status, this.sendAt]);
      this.channelSendAt = compositeKey([this.channelId, this.sendAt]);
    }

    if (p.dynamoDbUserMessage) {
      const {
        channelId,
        channelMessageId,
        channelSendAt,
        content,
        contentShort,
        deliveredAt,
        id,
        messageId,
        onid,
        osuId,
        sendAt,
        smsNumber,
        status,
        statusSendAt,
        title,
      } = p.dynamoDbUserMessage;
      if (deliveredAt) this.deliveredAt = deliveredAt.S;
      if (sendAt) this.sendAt = sendAt.S || '';
      if (messageId) this.messageId = messageId.S || '';
      if (status) this.status = status.S || '';
      if (id) this.id = id.S || '';
      if (onid) this.onid = onid.S || '';
      if (osuId) this.osuId = osuId.S || '';
      if (channelId) this.channelId = channelId.S || '';
      if (content) this.content = content.S || '';
      if (contentShort) this.contentShort = contentShort.S || '';
      if (channelMessageId) this.channelMessageId = channelMessageId.S || '';
      if (channelSendAt) this.channelSendAt = channelSendAt.S || '';
      if (smsNumber) this.smsNumber = smsNumber.S || '';
      if (statusSendAt) this.statusSendAt = statusSendAt.S || '';
      if (title) this.title = title.S || '';
    }
  }

  static upsert = async (props: UserMessage): Promise<UserMessageResults> => {
    // ! DynamoDb only supports 'ALL_OLD' or 'NONE' for return values from the
    // ! putItem call, which means the only way to get values from ddb would be to
    // ! getItem with the key after having put the item successfully. The DX use
    // ! doesn't really seem like it needs to fetch the record after having created it
    // ! the first time.
    try {
      const params: AWS.DynamoDB.PutItemInput = {
        TableName: UserMessage.TABLE_NAME,
        Item: UserMessage.asDynamoDbItem(props),
        ReturnValues: 'NONE',
      };

      await putItem(params);
      console.log('UserMessage.upsert succeeded:', props);
      return UserMessage.find(props.id, props.messageId, props.channelId);
    } catch (err) {
      console.error(`UserMessage.upsert failed:`, props, err);
      throw err;
    }
  };

  static findAll = async (id: string, lastKey?: string): Promise<UserMessageResults> => {
    try {
      const params: AWS.DynamoDB.QueryInput = {
        TableName: UserMessage.TABLE_NAME,
        IndexName: UserMessage.SEND_AT_INDEX_NAME,
        KeyConditionExpression: '#keyAttribute = :keyValue',
        ExpressionAttributeNames: {
          '#keyAttribute': 'id',
        },
        ExpressionAttributeValues: {
          ':keyValue': { S: id },
        },
        ScanIndexForward: false,
        Select: 'ALL_ATTRIBUTES',
      };
      if (lastKey) params.ExclusiveStartKey = urlSafeBase64Decode(lastKey) as AWS.DynamoDB.Key;

      return UserMessage.asUserMessageResults(params);
    } catch (err) {
      console.error(`UserMessage.findAll(${id}) failed:`, err);
      throw err;
    }
  };

  static find = async (
    id: string,
    messageId: string,
    channelId: string,
  ): Promise<UserMessageResults> => {
    try {
      const params: AWS.DynamoDB.QueryInput = {
        TableName: UserMessage.TABLE_NAME,
        KeyConditionExpression: '#keyAttribute = :keyValue AND #rangeAttribute = :rangeValue',
        ExpressionAttributeNames: {
          '#keyAttribute': 'id',
          '#rangeAttribute': UserMessage.COMPOSITE_KEY_NAME,
        },
        ExpressionAttributeValues: {
          ':keyValue': { S: id },
          ':rangeValue': { S: compositeKey([channelId, messageId]) },
        },
        Select: 'ALL_ATTRIBUTES',
      };

      return UserMessage.asUserMessageResults(params);
    } catch (err) {
      console.error(`UserMessage.find(${id}, ${messageId}, ${channelId}) failed:`, err);
      throw err;
    }
  };

  static byStatus = async (
    id: string,
    status: Status,
    lastKey?: string,
  ): Promise<UserMessageResults> => {
    try {
      const params: AWS.DynamoDB.QueryInput = {
        TableName: UserMessage.TABLE_NAME,
        IndexName: UserMessage.STATUS_INDEX_NAME,
        KeyConditionExpression:
          '#keyAttribute = :keyValue AND begins_with(#rangeAttribute, :rangeValue)',
        ExpressionAttributeNames: {
          '#keyAttribute': 'id',
          '#rangeAttribute': 'statusSendAt',
        },
        ExpressionAttributeValues: {
          ':keyValue': { S: id },
          ':rangeValue': { S: status },
        },
        ScanIndexForward: false,
        Select: 'ALL_ATTRIBUTES',
      };
      if (lastKey) params.ExclusiveStartKey = urlSafeBase64Decode(lastKey) as AWS.DynamoDB.Key;

      return UserMessage.asUserMessageResults(params);
    } catch (err) {
      console.error(`UserMessage.byStatus(${id}, ${status}) failed:`, err);
      throw err;
    }
  };

  static allByStatus = async (status: Status, lastKey?: string): Promise<UserMessageResults> => {
    try {
      const params: AWS.DynamoDB.QueryInput = {
        TableName: UserMessage.TABLE_NAME,
        IndexName: UserMessage.ALL_BY_STATUS_INDEX_NAME,
        KeyConditionExpression: '#keyAttribute = :keyValue',
        ExpressionAttributeNames: {
          '#keyAttribute': 'status',
        },
        ExpressionAttributeValues: {
          ':keyValue': { S: status },
        },
        ScanIndexForward: false,
        Select: 'ALL_ATTRIBUTES',
      };
      if (lastKey) params.ExclusiveStartKey = urlSafeBase64Decode(lastKey) as AWS.DynamoDB.Key;

      return UserMessage.asUserMessageResults(params);
    } catch (err) {
      console.error(`UserMessage.allByStatus(${status}) failed:`, err);
      throw err;
    }
  };

  static byChannel = async (
    id: string,
    channelId: ChannelId,
    lastKey?: string,
  ): Promise<UserMessageResults> => {
    try {
      const params: AWS.DynamoDB.QueryInput = {
        TableName: UserMessage.TABLE_NAME,
        IndexName: UserMessage.CHANNEL_INDEX_NAME,
        KeyConditionExpression:
          '#keyAttribute = :keyValue AND begins_with(#rangeAttribute, :rangeValue)',
        ExpressionAttributeNames: {
          '#keyAttribute': 'id',
          '#rangeAttribute': 'channelSendAt',
        },
        ExpressionAttributeValues: {
          ':keyValue': { S: id },
          ':rangeValue': { S: channelId },
        },
        ScanIndexForward: false,
        Select: 'ALL_ATTRIBUTES',
      };
      if (lastKey) params.ExclusiveStartKey = urlSafeBase64Decode(lastKey) as AWS.DynamoDB.Key;

      return UserMessage.asUserMessageResults(params);
    } catch (err) {
      console.error(`UserMessage.byChannel(${id}, ${channelId}) failed:`, err);
      throw err;
    }
  };

  static updateStatus = async (props: UserMessage, status: string): Promise<UserMessageResults> => {
    try {
      const userMessage = props;
      const params: AWS.DynamoDB.UpdateItemInput = {
        TableName: UserMessage.TABLE_NAME,
        Key: {
          id: { S: userMessage.id.toString() },
          [UserMessage.COMPOSITE_KEY_NAME]: {
            S: compositeKey([userMessage.channelId, userMessage.messageId]),
          },
        },
        ReturnValues: 'NONE',
        UpdateExpression: 'SET #S = :s, #SSA = :ssa',
        ExpressionAttributeNames: { '#S': 'status', '#SSA': 'statusSendAt' },
        ExpressionAttributeValues: {
          ':s': { S: status },
          ':ssa': { S: compositeKey([status, props.sendAt]) },
        },
      };

      await updateItem(params);
      userMessage.status = status;
      userMessage.statusSendAt = compositeKey([props.status, props.sendAt]);
      console.log('UserMessage.updateStatus succeeded:', userMessage);
      return UserMessage.find(userMessage.id, userMessage.messageId, userMessage.channelId);
    } catch (err) {
      console.error(`UserMessage.updateStatus failed:`, err);
      throw err;
    }
  };

  /**
   * Translate the properties into the properly shaped data as an Item for
   * Dynamodb.
   * @param props - the properties to translate to a dynamodb item
   * @returns - the Item for use in Dynamodb
   */
  static asDynamoDbItem = (props: UserMessage): DynamoDBUserMessageItem => {
    return {
      channelId: { S: props.channelId },
      channelMessageId: {
        S: props.channelMessageId ?? compositeKey([props.channelId, props.messageId]),
      },
      channelSendAt: {
        S: props.channelSendAt ?? compositeKey([props.channelId, props.sendAt]),
      },
      content: { S: props.content },
      contentShort: { S: props.contentShort },
      deliveredAt: props.deliveredAt ? { S: props.deliveredAt } : { NULL: true },
      messageId: { S: props.messageId },
      id: { S: props.id },
      onid: props.onid ? { S: props.onid } : { NULL: true },
      osuId: props.osuId ? { S: props.osuId } : { NULL: true },
      sendAt: { S: props.sendAt },
      smsNumber: props.smsNumber ? { S: props.smsNumber } : { NULL: true },
      status: { S: props.status },
      statusSendAt: {
        S: props.statusSendAt ?? compositeKey([props.status, props.sendAt]),
      },
      title: { S: props.title },
    };
  };

  static asUserMessageResults = async (
    params: AWS.DynamoDB.QueryInput,
  ): Promise<UserMessageResults> => {
    const results: AWS.DynamoDB.QueryOutput = await query(params);
    console.log('Queried -->  ', params, results.Items);
    if (!results.Items)
      return {
        items: [],
        count: 0,
      };
    return {
      items: results.Items.map((i) => new UserMessage({ dynamoDbUserMessage: i })),
      count: results.Count || 0,
      lastKey: results.LastEvaluatedKey ? urlSafeBase64Encode(results.LastEvaluatedKey) : undefined,
    };
  };
}

export default UserMessage;
