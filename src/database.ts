import { DynamoDB } from 'aws-sdk';
import { DYNAMODB_API_VERSION } from './constants';

const database = new DynamoDB({ apiVersion: DYNAMODB_API_VERSION });

export const putItem = (i: DynamoDB.PutItemInput): Promise<DynamoDB.PutItemOutput> =>
  database.putItem(i).promise();

export const query = (i: DynamoDB.QueryInput): Promise<DynamoDB.QueryOutput> =>
  database.query(i).promise();

export default database;
