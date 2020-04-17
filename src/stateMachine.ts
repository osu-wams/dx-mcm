import { StepFunctions } from 'aws-sdk'; // eslint-disable-line no-unused-vars

const stepFunctions = new StepFunctions();

export const startExecution = async (params: {
  stateMachineArn: string;
  input: string;
  name: string;
}): Promise<StepFunctions.StartExecutionOutput> => stepFunctions.startExecution(params).promise();

export default startExecution;
