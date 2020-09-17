import Message from '@src/models/message'; // eslint-disable-line no-unused-vars

export interface MessageStateMachineResult extends Message {
  processedQueries: {
    users?: UserData[];
    channels?: string[];
  }[];
}

export interface UserData {
  id: string;
  phone?: string;
  osuId?: string;
  onid?: string;
}

export interface MessageWithPopulation extends Message {
  targetPopulation: UserData[];
}
