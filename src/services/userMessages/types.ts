import UserMessage from '@src/models/userMessage'; // eslint-disable-line no-unused-vars

export interface UserMessageStateMachineResult extends UserMessage {
  processedQueries: {
    sendToChannel?: boolean;
    sendUserMessages?: string[];
  }[];
}
