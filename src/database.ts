import { DynamoDB } from 'aws-sdk';
import { DYNAMODB_API_VERSION, DYNAMODB_REGION } from './constants';

const database = new DynamoDB({ apiVersion: DYNAMODB_API_VERSION, region: DYNAMODB_REGION });

export const putItem = (i: DynamoDB.PutItemInput): Promise<DynamoDB.PutItemOutput> =>
  database.putItem(i).promise();

export const updateItem = (i: DynamoDB.UpdateItemInput): Promise<DynamoDB.UpdateItemOutput> =>
  database.updateItem(i).promise();

export const query = (i: DynamoDB.QueryInput): Promise<DynamoDB.QueryOutput> =>
  database.query(i).promise();

export default database;
