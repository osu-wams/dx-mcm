/* eslint-disable no-unused-vars */
import { Client, getMembers } from '@osu-wams/grouper';
import { uniqWith, isEqual } from 'lodash';
import type { UserData } from '@src/services/messages/types';
import { MessagePopulationParams } from '@src/models/message';
import { Subject } from '@osu-wams/grouper/dist/types';

const affiliationLookup: { [key: string]: string } = {
  undergrad: 'osu:ref:stu:level:01',
  teaching: 'osu:ref:stu:cert:next:cg11',
};

/**
 * Return a unique array of Users found in a Grouper group
 * @param client Grouper client
 * @param affiliation the affiliation to query
 */
const getMembersInAffiliation = async (
  client: Client,
  affiliation: string,
): Promise<UserData[]> => {
  try {
    const pageSize = 5000;
    const members: Subject[] = [];
    let fetchMembers = true;
    let pageNumber = 1;

    while (fetchMembers && pageNumber < 10) {
      // eslint-disable-next-line
      const results = await getMembers(client, [affiliation], ['id'], { pageNumber, pageSize });
      const pageSubjectCount = results.reduce((p, v) => p + (v.subjects ?? []).length, 0);
      if (pageSubjectCount > 0) {
        pageNumber += 1;
        const subjects = results.map((r) => r.subjects ?? []).flat();
        members.push(...subjects);
      } else {
        fetchMembers = false;
      }
    }
    return uniqWith(
      members.map(({ id }) => ({ id, onid: id })),
      isEqual,
    );
  } catch (err) {
    console.error(err);
    throw new Error(`getMembersInAffiliation failed: ${err.message}`);
  }
};

const getAllMembers = async (client: Client, affiliations: string[]): Promise<UserData[]> => {
  try {
    const userData: UserData[] = [];
    for (let i = 0; i < affiliations.length; i += 1) {
      // eslint-disable-next-line
      const m = await getMembersInAffiliation(client, affiliations[i]);
      userData.push(...m);
    }
    return uniqWith(userData, isEqual);
  } catch (err) {
    console.error(err);
    throw new Error(`getAllMembers failed: ${err.message}`);
  }
};

/**
 * Given the populationParams provided in the step function event, combine the list
 * of users with the results of querying Grouper to find users affiliated with
 * specific affiliation groups.
 *
 *  users [UserData[]] : An array of user ids with optional sms, osuId, and onid,
 *                       these are specifically identified users.
 * affiliations: [string[]] : An array of Grouper groups to query for targetting
 *                            population(s) of users. (ie. 'undergrad', 'graduate', etc)
 *
 * @param event lambda step function event
 * @param _context unused
 * @param callback callback to return from step function
 */
export const handler = async (event: any, _context: any, callback: any) => {
  const { users, affiliations }: MessagePopulationParams = event.populationParams;
  const foundUsers: UserData[] = users ?? [];
  const affiliationStems = affiliations?.map((a) => affiliationLookup[a]).filter(Boolean);

  if (affiliationStems?.length) {
    try {
      const c = new Client({
        host: process.env.GROUPER_HOST?.toString() ?? '',
        username: process.env.GROUPER_USERNAME,
        password: process.env.GROUPER_PASSWORD,
      });

      const foundInGrouper = await getAllMembers(c, affiliationStems ?? []);
      console.info('usersFoundInGrouper', foundInGrouper);
      foundUsers.push(...foundInGrouper);
    } catch (err) {
      console.error('stepGetUserPopulation error when using Grouper API', err);
    }
  }

  // Return a unique array of user ids and phones by spreading a Set
  callback(null, { users: foundUsers });
};

export default handler;
