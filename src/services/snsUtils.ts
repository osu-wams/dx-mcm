import { SNSEvent, SNSEventRecord } from 'aws-lambda'; // eslint-disable-line no-unused-vars, import/no-unresolved

/**
 * Validate and return the SNS record associated to this event.
 * @param event - An event from SNS
 * @returns Array[boolean, record] - If the validation was successful and the record it validated or undefined
 * @see <project_root>/events/lambda.sns.*
 */
export const validate = (event: SNSEvent): [boolean, SNSEventRecord | undefined] => {
  if (event.Records.length === 0) {
    console.error(`Event has no records -->  `, event);
    return [false, undefined];
  }

  // SNS will only ever contain one record per event (see Reliability FAQ at https://aws.amazon.com/sns/faqs/)
  const record = event.Records.shift();
  if (!record) {
    console.error(`Event record invalid -->  `, event);
    return [false, undefined];
  }

  return [true, record];
};

export default validate;
