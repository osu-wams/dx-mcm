import { SNS, AWSError } from 'aws-sdk'; // eslint-disable-line no-unused-vars

const messagePubSub = new SNS();

export const publish = async (params: SNS.PublishInput): Promise<SNS.PublishResponse | AWSError> =>
  messagePubSub.publish(params).promise();

export default publish;
