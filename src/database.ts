require('./config');

import { DYNAMODB_API_VERSION } from './constants';
import { DynamoDB } from 'aws-sdk';

const database = new DynamoDB({ apiVersion: DYNAMODB_API_VERSION });

export const putItem = (i: DynamoDB.PutItemInput): Promise<DynamoDB.PutItemOutput> =>
  database.putItem(i).promise();

export const query = (i: DynamoDB.QueryInput): Promise<DynamoDB.QueryOutput> =>
  database.query(i).promise();

export const createTable = (t: DynamoDB.CreateTableInput): Promise<DynamoDB.CreateTableOutput> =>
  database.createTable(t).promise();

export default database;
