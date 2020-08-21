/* eslint-disable no-unused-vars */
import { Client, getMembers } from '@osu-wams/grouper';
import type { UserData } from './types';

export const handler = async (event: any, _context: any, callback: any) => {
  const { users }: { users: UserData[] } = event.populationParams;

  const c = new Client({
    host: 'grouper.oregonstate.edu',
  });
  getMembers(c, ['osu:ref:stu:level:01'], ['name'], { pageSize: 5000, pageNumber: 5 });
  // TODO: With the provided event.populationParams, lookup all of the osuId's that match
  const foundUsers: UserData[] = users ?? [];

  // Return a unique array of user ids and phones by spreading a Set
  callback(null, { users: foundUsers });
};

export default handler;
