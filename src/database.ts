require('./config');

import { DYNAMODB_API_VERSION } from './constants';
import { DynamoDB } from 'aws-sdk';

const database = new DynamoDB({ apiVersion: DYNAMODB_API_VERSION });
export default database;
