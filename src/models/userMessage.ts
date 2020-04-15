import { DYNAMODB_TABLE_PREFIX } from '@src/constants';
import { DynamoDB } from 'aws-sdk'; // eslint-disable-line no-unused-vars
import { putItem, updateItem, query } from '@src/database';

export interface DynamoDBUserMessageItem extends DynamoDB.PutItemInputAttributeMap {
  channelId: { S: string };
  channelMessageId: { S: string };
  content: { S: string };
  contentShort: { S: string };
  messageId: { S: string };
  osuId: { S: string }; // sort key
  sendAt: { S: string }; // partition key
  status: { S: string };
}

interface UserMessageParams {
  dynamoDbUserMessage?: AWS.DynamoDB.AttributeMap;
  userMessage?: {
    channelId: string;
    content: string;
    contentShort: string;
    messageId: string;
    osuId: string;
    sendAt: string;
    status: string;
  };
}

export interface UserMessageStatus {
  channelId: string;
  channelMessageId: string;
  messageId: string;
  osuId: string;
  sendAt: string;
  status: string;
}

/* eslint-disable no-unused-vars */
export enum Status {
  NEW = 'NEW',
  READ = 'READ',
  ARCHIVED = 'ARCHIVED',
  DELETED = 'DELETED',
}
/* eslint-enable no-unused-vars */

/**
 * Generate the composite key value (<channelId>:<messageId>) to act as the
 * RANGE key for DynamoDb
 * @param channelId the channel id
 * @param messageId the message id
 */
const channelMessageId = (channelId: string, messageId: string): string => {
  if (channelId.length > 0 && messageId.length > 0) return `${channelId}:${messageId}`;
  return '';
};

class UserMessage {
  channelId: string = '';

  channelMessageId?: string;

  content: string = '';

  contentShort: string = '';

  messageId: string = '';

  osuId: string = '';

  sendAt: string = '';

  status: string = Status.NEW;

  static TABLE_NAME: string = `${DYNAMODB_TABLE_PREFIX}-UserMessages`;

  static STATUS_INDEX_NAME: string = `${DYNAMODB_TABLE_PREFIX}-UserMessageStatuses`;

  static CHANNEL_INDEX_NAME: string = `${DYNAMODB_TABLE_PREFIX}-UserMessageChannels`;

  static SEND_AT_INDEX_NAME: string = `${DYNAMODB_TABLE_PREFIX}-UserMessageSendAt`;

  static COMPOSITE_KEY_NAME: string = 'channelMessageId';

  constructor(p: UserMessageParams) {
    if (p.userMessage) {
      const { sendAt, messageId, osuId, status, channelId, content, contentShort } = p.userMessage;
      this.sendAt = sendAt;
      this.messageId = messageId;
      this.status = status;
      this.osuId = osuId;
      this.channelId = channelId;
      this.content = content;
      this.contentShort = contentShort;
      this.channelMessageId = channelMessageId(this.channelId, this.messageId);
    }

    if (p.dynamoDbUserMessage) {
      const {
        sendAt,
        channelMessageId: dbChannelMessageId,
        messageId,
        status,
        osuId,
        channelId,
        content,
        contentShort,
      } = p.dynamoDbUserMessage;
      if (sendAt) this.sendAt = sendAt.S || '';
      if (messageId) this.messageId = messageId.S || '';
      if (status) this.status = status.S || '';
      if (osuId) this.osuId = osuId.S || '';
      if (channelId) this.channelId = channelId.S || '';
      if (content) this.content = content.S || '';
      if (contentShort) this.contentShort = contentShort.S || '';
      if (dbChannelMessageId) this.channelMessageId = dbChannelMessageId.S || '';
    }
  }

  static upsert = async (props: UserMessage): Promise<UserMessage | undefined> => {
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

      const result = await putItem(params);
      console.log('UserMessage.upsert succeeded:', result);
      return UserMessage.find(props.osuId, props.messageId, props.channelId);
    } catch (err) {
      console.error(`UserMessage.upsert failed:`, props, err);
      throw err;
    }
  };

  static findAll = async (osuId: string): Promise<UserMessage[] | null> => {
    try {
      const params: AWS.DynamoDB.QueryInput = {
        TableName: UserMessage.TABLE_NAME,
        KeyConditionExpression: '#keyAttribute = :keyValue',
        ExpressionAttributeNames: {
          '#keyAttribute': 'osuId',
        },
        ExpressionAttributeValues: {
          ':keyValue': { S: osuId },
        },
        Select: 'ALL_ATTRIBUTES',
      };
      const results: AWS.DynamoDB.QueryOutput = await query(params);
      if (!results.Items) return [];
      return results.Items.map((i) => new UserMessage({ dynamoDbUserMessage: i }));
    } catch (err) {
      console.error(`UserMessage.findAll(${osuId}) failed:`, err);
      throw err;
    }
  };

  static find = async (
    osuId: string,
    messageId: string,
    channelId: string,
  ): Promise<UserMessage | undefined> => {
    try {
      const params: AWS.DynamoDB.QueryInput = {
        TableName: UserMessage.TABLE_NAME,
        KeyConditionExpression: '#keyAttribute = :keyValue AND #rangeAttribute = :rangeValue',
        ExpressionAttributeNames: {
          '#keyAttribute': 'osuId',
          '#rangeAttribute': UserMessage.COMPOSITE_KEY_NAME,
        },
        ExpressionAttributeValues: {
          ':keyValue': { S: osuId },
          ':rangeValue': { S: channelMessageId(channelId, messageId) },
        },
        Select: 'ALL_ATTRIBUTES',
      };
      const results: AWS.DynamoDB.QueryOutput = await query(params);
      if (!results.Items) return undefined;
      return new UserMessage({ dynamoDbUserMessage: results.Items.shift() });
    } catch (err) {
      console.error(`UserMessage.find(${osuId}, ${messageId}, ${channelId}) failed:`, err);
      throw err;
    }
  };

  static byStatus = async (osuId: string, status: Status): Promise<UserMessageStatus[]> => {
    try {
      const params: AWS.DynamoDB.QueryInput = {
        TableName: UserMessage.TABLE_NAME,
        IndexName: UserMessage.STATUS_INDEX_NAME,
        KeyConditionExpression: '#keyAttribute = :keyValue AND #rangeAttribute = :rangeValue',
        ExpressionAttributeNames: {
          '#keyAttribute': 'osuId',
          '#rangeAttribute': 'status',
        },
        ExpressionAttributeValues: {
          ':keyValue': { S: osuId },
          ':rangeValue': { S: status },
        },
        Select: 'ALL_PROJECTED_ATTRIBUTES',
      };
      const results: AWS.DynamoDB.QueryOutput = await query(params);
      if (!results.Items) return [];
      return results.Items.map((i) => ({
        channelId: i.channelId.S!,
        channelMessageId: i.channelMessageId.S!,
        messageId: i.messageId.S!,
        osuId: i.osuId.S!,
        sendAt: i.sendAt.S!,
        status: i.status.S!,
      }));
    } catch (err) {
      console.error(`UserMessage.byStatus(${osuId}, ${status}) failed:`, err);
      throw err;
    }
  };

  static updateStatus = async (props: UserMessage, status: string): Promise<UserMessage> => {
    try {
      const userMessage = props;
      const params: AWS.DynamoDB.UpdateItemInput = {
        TableName: UserMessage.TABLE_NAME,
        Key: {
          osuId: { S: userMessage.osuId.toString() },
          [UserMessage.COMPOSITE_KEY_NAME]: {
            S: channelMessageId(userMessage.channelId, userMessage.messageId),
          },
        },
        ReturnValues: 'NONE',
        UpdateExpression: 'SET #updateAttribute = :updateAttributeValue',
        ExpressionAttributeNames: { '#updateAttribute': 'status' },
        ExpressionAttributeValues: { ':updateAttributeValue': { S: status } },
      };

      const result = await updateItem(params);
      console.log('UserMessage.updateStatus succeeded:', result);
      userMessage.status = status;
      return userMessage;
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
        S: props.channelMessageId ?? channelMessageId(props.channelId, props.messageId),
      },
      content: { S: props.content },
      contentShort: { S: props.contentShort },
      messageId: { S: props.messageId },
      osuId: { S: props.osuId },
      sendAt: { S: props.sendAt },
      status: { S: props.status },
    };
  };
}

export default UserMessage;
