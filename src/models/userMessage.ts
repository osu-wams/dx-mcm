import { DYNAMODB_TABLE_PREFIX } from '@src/constants';
import { DynamoDB } from 'aws-sdk'; // eslint-disable-line no-unused-vars
import { putItem, updateItem, query, deleteItem } from '@src/database';
import { DashboardChannel, SmsChannel } from '@src/models/channels';
import type Channel from '@src/models/channels/channel'; // eslint-disable-line no-unused-vars
import { urlSafeBase64Encode, urlSafeBase64Decode } from './utils';

export type Constructor<T> = new (...args: any[]) => T;

export interface DynamoDBUserMessageItem extends DynamoDB.PutItemInputAttributeMap {
  channelId: { S: string };
  channelMessageId: { S: string };
  content: { S: string };
  contentShort: { S: string };
  deliveredAt: { S: string } | { NULL: boolean };
  id: { S: string };
  imageUrl: { S: string } | { NULL: boolean };
  messageId: { S: string };
  onid: { S: string } | { NULL: boolean };
  osuId: { S: string } | { NULL: boolean };
  sendAt: { S: string };
  smsNumber: { S: string } | { NULL: boolean };
  status: { S: string };
  title: { S: string };
  updatedAt: { S: string };
}

export interface DynamoDBUserMessageDeliveredItem extends DynamoDBUserMessageItem {
  channelDeliveredAt: { S: string };
}

export interface DynamoDBUserMessagePendingItem extends DynamoDBUserMessageItem {
  messageChannelUser: { S: string };
  updatedAtMessageId: { S: string };
}
export interface UserMessageParams {
  dynamoDbUserMessage?: AWS.DynamoDB.AttributeMap;
  userMessage?: {
    channelDeliveredAt?: string;
    channelId: string;
    channelMessageId?: string;
    content: string;
    contentShort: string;
    deliveredAt?: string;
    id: string;
    imageUrl?: string;
    messageChannelUser?: string;
    messageId: string;
    onid?: string;
    osuId?: string;
    sendAt: string;
    smsNumber?: string;
    status: string;
    statusMessage?: string;
    title: string;
    updatedAt?: string;
    updatedAtMessageId?: string;
  };
}

export interface UserMessageResults<T> {
  items: T[];
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

export const compositeKey = (fields: string[], separator: string = '#'): string => {
  if (fields.every((f) => !f)) return '';
  return fields.join(separator);
};

class UserMessage {
  channelDeliveredAt?: string = '';

  channelId: string = '';

  channelMessageId?: string = '';

  content: string = '';

  contentShort: string = '';

  deliveredAt?: string = '';

  id: string = '';

  imageUrl?: string = '';

  messageChannelUser?: string = '';

  messageId: string = '';

  onid?: string = '';

  osuId?: string = '';

  sendAt: string = '';

  smsNumber?: string = '';

  status: string = Status.NEW;

  title: string = '';

  updatedAt: string = '';

  updatedAtMessageId?: string = '';

  static TABLE_NAME: string = `${DYNAMODB_TABLE_PREFIX}-UserMessages`;

  static BY_CHANNEL_INDEX: string = `${DYNAMODB_TABLE_PREFIX}-UserMessageByChannel`;

  static BY_SEND_AT_INDEX: string = `${DYNAMODB_TABLE_PREFIX}-UserMessageBySendAt`;

  constructor(p: UserMessageParams) {
    if (p.userMessage) {
      const {
        channelDeliveredAt,
        channelId,
        channelMessageId,
        content,
        contentShort,
        deliveredAt,
        id,
        imageUrl,
        messageId,
        onid,
        osuId,
        sendAt,
        smsNumber,
        status,
        title,
        updatedAt,
      } = p.userMessage;
      this.channelDeliveredAt = channelDeliveredAt;
      this.sendAt = sendAt;
      this.deliveredAt = deliveredAt;
      this.id = id;
      this.imageUrl = imageUrl;
      this.messageId = messageId;
      this.status = status;
      this.onid = onid;
      this.osuId = osuId;
      this.channelId = channelId;
      this.content = content;
      this.contentShort = contentShort;
      this.smsNumber = smsNumber;
      this.title = title;
      this.updatedAt = updatedAt ?? new Date().toISOString();
      this.channelMessageId = channelMessageId ?? compositeKey([this.channelId, this.messageId]);
    }

    if (p.dynamoDbUserMessage) {
      const {
        channelDeliveredAt,
        channelId,
        channelMessageId,
        content,
        contentShort,
        deliveredAt,
        id,
        imageUrl,
        messageId,
        onid,
        osuId,
        sendAt,
        smsNumber,
        status,
        title,
        updatedAt,
      } = p.dynamoDbUserMessage;
      if (channelDeliveredAt) this.channelDeliveredAt = channelDeliveredAt.S || '';
      if (deliveredAt) this.deliveredAt = deliveredAt.S || '';
      if (sendAt) this.sendAt = sendAt.S || '';
      if (messageId) this.messageId = messageId.S || '';
      if (status) this.status = status.S || '';
      if (id) this.id = id.S || '';
      if (imageUrl) this.imageUrl = imageUrl.S || '';
      if (onid) this.onid = onid.S || '';
      if (osuId) this.osuId = osuId.S || '';
      if (channelId) this.channelId = channelId.S || '';
      if (content) this.content = content.S || '';
      if (contentShort) this.contentShort = contentShort.S || '';
      if (smsNumber) this.smsNumber = smsNumber.S || '';
      if (title) this.title = title.S || '';
      if (updatedAt) this.updatedAt = updatedAt.S || '';
      if (channelMessageId)
        this.channelMessageId =
          channelMessageId.S || compositeKey([this.channelId, this.messageId]);
    }
  }

  static upsert = async (props: UserMessage): Promise<UserMessageResults<UserMessage>> => {
    // ! DynamoDb only supports 'ALL_OLD' or 'NONE' for return values from the
    // ! putItem call, which means the only way to get values from ddb would be to
    // ! getItem with the key after having put the item successfully. The DX use
    // ! doesn't really seem like it needs to fetch the record after having created it
    // ! the first time.
    const userMessage = new UserMessage({ userMessage: props });
    const TableName = UserMessage.TABLE_NAME;
    try {
      const Item = userMessage.asDynamoDbItem();
      const params: AWS.DynamoDB.PutItemInput = {
        TableName,
        Item,
        ReturnValues: 'NONE',
      };
      await putItem(params);
      console.log(`UserMessage.upsert to ${TableName} succeeded:`, userMessage);

      const { id, messageId, channelId, status } = userMessage;
      return UserMessage.find({ id, messageId, channelId, status });
    } catch (err) {
      console.error(`UserMessage.upsert to ${TableName} failed:`, props, err);
      throw err;
    }
  };

  static find = async (args: {
    id: string;
    messageId: string;
    channelId: string;
    status?: string;
  }): Promise<UserMessageResults<UserMessage>> => {
    try {
      const params: AWS.DynamoDB.QueryInput = {
        TableName: UserMessage.TABLE_NAME,
        KeyConditionExpression: '#keyAttribute = :keyValue AND #rangeAttribute = :rangeValue',
        ExpressionAttributeNames: {
          '#keyAttribute': 'id',
          '#rangeAttribute': 'channelMessageId',
        },
        ExpressionAttributeValues: {
          ':keyValue': { S: args.id },
          ':rangeValue': { S: compositeKey([args.channelId, args.messageId]) },
        },
        Select: 'ALL_ATTRIBUTES',
      };

      return UserMessage.asUserMessageResults(params, UserMessage);
    } catch (err) {
      console.error(
        `UserMessage.find(${args.id}, ${args.messageId}, ${args.channelId}) failed:`,
        err,
      );
      throw err;
    }
  };

  static findAll = async (
    id: string,
    lastKey?: string,
  ): Promise<UserMessageResults<UserMessage>> => {
    try {
      const params: AWS.DynamoDB.QueryInput = {
        TableName: UserMessage.TABLE_NAME,
        IndexName: UserMessage.BY_SEND_AT_INDEX,
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

      return UserMessage.asUserMessageResults(params, UserMessage);
    } catch (err) {
      console.error(`UserMessage.findAll(${id}) failed:`, err);
      throw err;
    }
  };

  static byChannel = async (
    id: string,
    channelId: ChannelId,
    lastKey?: string,
  ): Promise<UserMessageResults<UserMessage>> => {
    try {
      const params: AWS.DynamoDB.QueryInput = {
        TableName: UserMessage.TABLE_NAME,
        IndexName: UserMessage.BY_CHANNEL_INDEX,
        KeyConditionExpression:
          '#keyAttribute = :keyValue AND begins_with(#rangeAttribute, :rangeValue)',
        ExpressionAttributeNames: {
          '#keyAttribute': 'id',
          '#rangeAttribute': 'channelDeliveredAt',
        },
        ExpressionAttributeValues: {
          ':keyValue': { S: id },
          ':rangeValue': { S: channelId },
        },
        ScanIndexForward: false,
        Select: 'ALL_ATTRIBUTES',
      };
      if (lastKey) params.ExclusiveStartKey = urlSafeBase64Decode(lastKey) as AWS.DynamoDB.Key;

      return UserMessage.asUserMessageResults(params, UserMessage);
    } catch (err) {
      console.error(`UserMessage.byChannel(${id}, ${channelId}) failed:`, err);
      throw err;
    }
  };

  static updateStatus = async (
    props: UserMessage,
    status: string,
  ): Promise<UserMessageResults<UserMessage>> => {
    try {
      const userMessage = props;
      const params: AWS.DynamoDB.UpdateItemInput = {
        TableName: UserMessage.TABLE_NAME,
        Key: {
          id: { S: userMessage.id.toString() },
          channelMessageId: { S: compositeKey([userMessage.channelId, userMessage.messageId]) },
        },
        ReturnValues: 'NONE',
        UpdateExpression: 'SET #S = :s, #UA = :ua',
        ExpressionAttributeNames: { '#S': 'status', '#UA': 'updatedAt' },
        ExpressionAttributeValues: {
          ':s': { S: status },
          ':ua': { S: new Date().toISOString() },
        },
      };

      await updateItem(params);
      userMessage.status = status;
      console.log('UserMessage.updateStatus succeeded:', userMessage);
      const { id, messageId, channelId } = userMessage;
      return UserMessage.find({ id, messageId, channelId, status });
    } catch (err) {
      console.error(`UserMessage.updateStatus failed:`, err);
      throw err;
    }
  };

  static delete = async (args: {
    id: string;
    messageId: string;
    channelId: string;
    status?: string;
  }): Promise<boolean> => {
    try {
      const found = await UserMessage.find({
        id: args.id,
        messageId: args.messageId,
        channelId: args.channelId,
      });
      const foundUserMessage = found.items.shift();
      if (foundUserMessage) {
        const params: AWS.DynamoDB.DeleteItemInput = {
          TableName: UserMessage.TABLE_NAME,
          Key: {
            id: { S: args.id },
            channelMessageId: { S: compositeKey([args.channelId, args.messageId]) },
          },
          ReturnValues: 'NONE',
        };
        await deleteItem(params);
      } else {
        console.debug(
          `UserMessage.delete(${args.id}, ${args.messageId}, ${args.channelId}) was unable to find the usermessage for deletion.`,
        );
      }
      return true;
    } catch (err) {
      console.error(
        `UserMessage.delete(${args.id}, ${args.messageId}, ${args.channelId}) failed:`,
        err,
      );
      throw err;
    }
  };

  /**
   * Translate the properties into the properly shaped data as an Item for
   * Dynamodb.
   * @param props - the properties to translate to a dynamodb item
   * @returns - the Item for use in Dynamodb
   */
  asDynamoDbItem(): DynamoDBUserMessageItem {
    return {
      channelId: { S: this.channelId },
      title: { S: this.title },
      updatedAt: { S: this.updatedAt ?? new Date().toISOString() },
      content: { S: this.content },
      contentShort: { S: this.contentShort },
      messageId: { S: this.messageId },
      id: { S: this.id },
      sendAt: { S: this.sendAt },
      status: { S: this.status },
      channelMessageId: {
        S: compositeKey([this.channelId, this.messageId]),
      },
      deliveredAt: this.deliveredAt ? { S: this.deliveredAt } : { NULL: true },
      channelDeliveredAt: { S: compositeKey([this.channelId, this.deliveredAt!]) },
      imageUrl: this.imageUrl ? { S: this.imageUrl } : { NULL: true },
      onid: this.onid ? { S: this.onid } : { NULL: true },
      osuId: this.osuId ? { S: this.osuId } : { NULL: true },
      smsNumber: this.smsNumber ? { S: this.smsNumber } : { NULL: true },
    };
  }

  static asUserMessageResults = async <T>(
    params: AWS.DynamoDB.QueryInput,
    Klass: Constructor<T>,
  ): Promise<UserMessageResults<T>> => {
    const results: AWS.DynamoDB.QueryOutput = await query(params);
    console.log('Queried -->  ', params, results.Items);
    if (!results.Items)
      return {
        items: [],
        count: 0,
      };
    return {
      items: results.Items.map((i) => new Klass({ dynamoDbUserMessage: i })),
      count: results.Count || 0,
      lastKey: results.LastEvaluatedKey ? urlSafeBase64Encode(results.LastEvaluatedKey) : undefined,
    };
  };
}

export default UserMessage;
