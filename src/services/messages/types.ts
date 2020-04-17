import Message from '@src/models/message'; // eslint-disable-line no-unused-vars

export interface MessageStateMachineResult extends Message {
  processedQueries: {
    users?: string[];
    channels?: string[];
  }[];
}
