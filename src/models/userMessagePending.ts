import { DYNAMODB_TABLE_PREFIX } from '@src/constants';
import { putItem } from '@src/database';
import UserMessage, {
  ChannelId, // eslint-disable-line no-unused-vars
  compositeKey,
  DynamoDBUserMessagePendingItem, // eslint-disable-line no-unused-vars
  Status, // eslint-disable-line no-unused-vars
  UserMessageParams, // eslint-disable-line no-unused-vars
  UserMessageResults, // eslint-disable-line no-unused-vars
} from './userMessage';
import { urlSafeBase64Decode } from './utils';

class UserMessagePending extends UserMessage {
  messageChannelUser: string = '';

  statusMessage?: string = '';

  updatedAtMessageId: string = '';

  constructor(p: UserMessageParams) {
    super(p);
    if (p.userMessage) {
      this.statusMessage = p.userMessage.statusMessage;
      this.updatedAtMessageId = p.userMessage.updatedAtMessageId || '';
      this.messageChannelUser = p.userMessage.messageChannelUser || '';
    } else if (p.dynamoDbUserMessage) {
      const { statusMessage, updatedAtMessageId, messageChannelUser } = p.dynamoDbUserMessage;
      if (statusMessage) this.statusMessage = statusMessage.S || '';
      if (updatedAtMessageId) this.updatedAtMessageId = updatedAtMessageId.S || '';
      if (messageChannelUser) this.messageChannelUser = messageChannelUser.S || '';
    }
  }

  asDynamoDbItem(): DynamoDBUserMessagePendingItem {
    return {
      ...super.asDynamoDbItem(),
      messageChannelUser: {
        S: compositeKey([this.messageId, this.channelId, this.id]),
      },
      statusMessage: this.statusMessage
        ? {
            S: this.statusMessage,
          }
        : { NULL: true },
      updatedAtMessageId: {
        S: compositeKey([this.updatedAt, this.messageId]),
      },
    };
  }

  static TABLE_NAME: string = `${DYNAMODB_TABLE_PREFIX}-UserMessagesPending`;

  static UPDATED_AT_INDEX: string = `${DYNAMODB_TABLE_PREFIX}-UserMessagePendingUpdatedAt`;

  static upsert = async (props: UserMessage): Promise<UserMessageResults<UserMessagePending>> => {
    // ! DynamoDb only supports 'ALL_OLD' or 'NONE' for return values from the
    // ! putItem call, which means the only way to get values from ddb would be to
    // ! getItem with the key after having put the item successfully. The DX use
    // ! doesn't really seem like it needs to fetch the record after having created it
    // ! the first time.
    const userMessage = new UserMessagePending({ userMessage: props });
    const TableName = UserMessagePending.TABLE_NAME;
    try {
      const Item = userMessage.asDynamoDbItem();
      const params: AWS.DynamoDB.PutItemInput = {
        TableName,
        Item,
        ReturnValues: 'NONE',
      };
      await putItem(params);
      console.log(`UserMessagePending.upsert to ${TableName} succeeded:`, userMessage);

      const { id, messageId, channelId, status } = userMessage;
      return UserMessagePending.find({ id, messageId, channelId, status });
    } catch (err) {
      console.error(`UserMessagePending.upsert to ${TableName} failed:`, props, err);
      throw err;
    }
  };

  static find = async (args: {
    id?: string;
    messageId?: string;
    channelId?: string;
    messageChannelUser?: string;
    status?: string;
  }): Promise<UserMessageResults<UserMessagePending>> => {
    try {
      const keyValue = args.status || Status.ERROR;
      const rangeValue =
        args.messageChannelUser || compositeKey([args.messageId!, args.channelId!, args.id!]);
      const params: AWS.DynamoDB.QueryInput = {
        TableName: UserMessagePending.TABLE_NAME,
        KeyConditionExpression: '#keyAttribute = :keyValue AND #rangeAttribute = :rangeValue',
        ExpressionAttributeNames: {
          '#keyAttribute': 'status',
          '#rangeAttribute': 'messageChannelUser',
        },
        ExpressionAttributeValues: {
          ':keyValue': { S: keyValue },
          ':rangeValue': { S: rangeValue },
        },
        Select: 'ALL_ATTRIBUTES',
      };

      return UserMessage.asUserMessageResults(params, UserMessagePending);
    } catch (err) {
      console.error(
        `UserMessage.find(${args.id}, ${args.messageId}, ${args.channelId}, ${args.messageChannelUser}) failed:`,
        err,
      );
      throw err;
    }
  };

  static findAll = async (
    _id: string, // eslint-disable-line no-unused-vars
    _lastKey?: string, // eslint-disable-line no-unused-vars
  ): Promise<UserMessageResults<UserMessagePending>> => {
    throw new Error('UserMessagePending.findAll not yet implemented.');
  };

  static byChannel = async (
    _id: string, // eslint-disable-line no-unused-vars
    _channelId: ChannelId, // eslint-disable-line no-unused-vars
    _lastKey?: string, // eslint-disable-line no-unused-vars
  ): Promise<UserMessageResults<UserMessagePending>> => {
    throw new Error('UserMessagePending.byChannel not yet implemented.');
  };

  static updateStatus = async (
    _props: UserMessage, // eslint-disable-line no-unused-vars
    _status: string, // eslint-disable-line no-unused-vars
  ): Promise<UserMessageResults<UserMessagePending>> => {
    throw new Error('UserMessagePending.updateStatus not yet implemented.');
  };

  static byMessage = async (
    status: string,
    messageId: string,
    lastKey?: string,
  ): Promise<UserMessageResults<UserMessagePending>> => {
    try {
      const params: AWS.DynamoDB.QueryInput = {
        TableName: UserMessagePending.TABLE_NAME,
        KeyConditionExpression:
          '#keyAttribute = :keyValue AND begins_with(#rangeAttribute, :rangeValue)',
        ExpressionAttributeNames: {
          '#keyAttribute': 'status',
          '#rangeAttribute': 'messageChannelUser',
        },
        ExpressionAttributeValues: {
          ':keyValue': { S: status },
          ':rangeValue': { S: messageId },
        },
        Select: 'ALL_ATTRIBUTES',
      };
      if (lastKey) params.ExclusiveStartKey = urlSafeBase64Decode(lastKey) as AWS.DynamoDB.Key;

      return UserMessagePending.asUserMessageResults(params, UserMessagePending);
    } catch (err) {
      console.error(`UserMessagePending.byMessage(${status}, ${messageId}) failed:`, err);
      throw err;
    }
  };

  static updatedSince = async (
    status: string,
    minAgo: number,
    lastKey?: string,
  ): Promise<UserMessageResults<UserMessagePending>> => {
    try {
      // 2020-01-01T01:01:01.000Z cut down to 2020-01-01T01:01 for inclusive query comparison
      const startDate = new Date(Date.now() - 1000 * 60 * minAgo).toISOString().slice(0, 16);
      const params: AWS.DynamoDB.QueryInput = {
        TableName: UserMessagePending.TABLE_NAME,
        IndexName: UserMessagePending.UPDATED_AT_INDEX,
        KeyConditionExpression: '#keyAttribute = :keyValue AND #rangeAttribute > :rangeValue',
        ExpressionAttributeNames: {
          '#keyAttribute': 'status',
          '#rangeAttribute': 'updatedAtMessageId',
        },
        ExpressionAttributeValues: {
          ':keyValue': { S: status },
          ':rangeValue': { S: startDate },
        },
        Select: 'ALL_ATTRIBUTES',
      };
      if (lastKey) params.ExclusiveStartKey = urlSafeBase64Decode(lastKey) as AWS.DynamoDB.Key;

      return UserMessagePending.asUserMessageResults(params, UserMessagePending);
    } catch (err) {
      console.error(`UserMessagePending.updatedSince(${status}, ${minAgo}) failed:`, err);
      throw err;
    }
  };
}
export default UserMessagePending;
