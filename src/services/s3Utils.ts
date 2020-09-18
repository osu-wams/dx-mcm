import { S3 } from 'aws-sdk'; // eslint-disable-line no-unused-vars
import { S3_API_VERSION, S3_REGION } from '@src/constants';

export const putObject = async <T>(message: T, key: string, bucket: string): Promise<boolean> => {
  try {
    const s3 = new S3({ apiVersion: S3_API_VERSION, region: S3_REGION });
    const params: S3.PutObjectRequest = {
      Body: JSON.stringify(message),
      Bucket: bucket,
      ContentType: 'application/json; charset=utf-8',
      Key: key,
    };
    await s3.putObject(params).promise();
    console.debug(`s3Utils.putObject succeeded putting ${key} in ${bucket}`);
    return true;
  } catch (e) {
    console.error('s3Utils.putObject error:', e);
    throw e;
  }
};

export const getObject = async <T>(key: string, bucket: string): Promise<T> => {
  try {
    const s3 = new S3({ apiVersion: S3_API_VERSION, region: S3_REGION });
    const params: S3.GetObjectRequest = {
      Bucket: bucket,
      Key: key,
    };
    const response = await s3.getObject(params).promise();
    if (response.Body) {
      console.debug(
        `s3Utils.getObject succeeded getting ${key} from ${bucket} with ${response.ContentLength} bytes.`,
      );
      return JSON.parse(response.Body?.toString());
    }
    throw new Error('response.Body not returned from S3');
  } catch (e) {
    console.error('s3Utils.getObject error:', e);
    throw e;
  }
};
