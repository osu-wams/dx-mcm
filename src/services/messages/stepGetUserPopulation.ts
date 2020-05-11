/* eslint-disable no-unused-vars */
import type { UserData } from './types';

export const handler = async (event: any, _context: any, callback: any) => {
  const { users }: { users: UserData[] } = event.populationParams;

  // TODO: With the provided event.populationParams, lookup all of the osuId's that match
  const foundUsers: UserData[] = users ?? [];

  // Return a unique array of user ids and phones by spreading a Set
  callback(null, { users: foundUsers });
};

export default handler;
