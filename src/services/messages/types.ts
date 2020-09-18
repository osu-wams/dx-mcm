import Message from '@src/models/message'; // eslint-disable-line no-unused-vars

export interface MessageStateMachineResult extends Message {
  processedQueries: {
    s3Data?: { key: string; bucket: string };
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
