/* eslint-disable no-unused-vars */
import { Client, getMembers } from '@osu-wams/grouper';
import type { MessageWithPopulation, UserData } from '@src/services/messages/types';
import Message, { MessagePopulationParams } from '@src/models/message';
import { Subject } from '@osu-wams/grouper/dist/types';
import { putObject } from '@src/services/s3Utils';
import { DATA_TRANSFER_BUCKET } from '@src/constants';

const dxGrouperBaseStem = 'app:dx:service:ref';

// Grouper subjects with sourceId that doesn't represent a user, could be another
// source group or similar.
const ignoreSourceIds = ['g:gsa'];

const affiliationLookup: { [key: string]: string } = {
  'all-students': `${dxGrouperBaseStem}:eligible-to-register`,
  'ecampus-students': `${dxGrouperBaseStem}:campus-ecampus`,
  'cascades-students': `${dxGrouperBaseStem}:campus-cascades`,
  'corvallis-students': `${dxGrouperBaseStem}:campus-corvallis`,
  'portland-students': `${dxGrouperBaseStem}:campus-portland`,
  'lagrande-students': `${dxGrouperBaseStem}:campus-lagrande`,
  'into-students': `${dxGrouperBaseStem}:into-students`,
  'undergraduate-students': `${dxGrouperBaseStem}:undergraduate-students`,
  'graduate-students': `${dxGrouperBaseStem}:graduate-students`,
  'all-employees': `${dxGrouperBaseStem}:employees-all`,
  'non-student-employees': `${dxGrouperBaseStem}:employees-no-students`,
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

    while (fetchMembers && pageNumber < 15) {
      // eslint-disable-next-line
      const results = await getMembers(client, [affiliation], ['id'], { pageNumber, pageSize });
      const pageSubjectCount = results.reduce((p, v) => p + (v.subjects ?? []).length, 0);
      if (pageSubjectCount > 0) {
        pageNumber += 1;
        const subjects = results.map((r) => r.subjects ?? []).flat();
        members.push(...subjects.filter((s) => !ignoreSourceIds.includes(s.sourceId)));
        console.debug(`getMembersInAffiliation fetch page ${pageNumber} count ${members.length}`);
      } else {
        fetchMembers = false;
      }
    }
    return members.map(({ id }) => ({ id, onid: id }));
  } catch (err) {
    console.error(err);
    throw new Error(`getMembersInAffiliation failed: ${err.message}`);
  }
};

const getAllMembers = async (client: Client, affiliations: string[]): Promise<UserData[]> => {
  try {
    let userData: UserData[] = [];
    for (let i = 0; i < affiliations.length; i += 1) {
      // eslint-disable-next-line
      const m = await getMembersInAffiliation(client, affiliations[i]);
      userData = userData.concat(m);
      console.debug(
        `getAllMembers affiliation process affiliation: ${affiliations[i]} returned ${m.length} making user data total ${userData.length}`,
      );
    }
    return userData;
  } catch (err) {
    console.error(err);
    throw new Error(`getAllMembers failed: ${err.message}`);
  }
};

const getTargetPopulation = (users: UserData[], foundUsers: UserData[]): UserData[] => {
  const uniqueUserIds = [...new Set(foundUsers.map((f) => f.id))];
  users.push(...uniqueUserIds.map((id) => ({ id, onid: id })));
  return users;
};

const copyMessageToS3 = async (message: Message, users: UserData[]): Promise<string> => {
  const object: MessageWithPopulation = {
    ...message,
    targetPopulation: users,
  };
  const key = `message-${object.sendAt}-${object.id}.json`;
  await putObject(object, key, DATA_TRANSFER_BUCKET);
  return key;
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
export const handler = async (event: Message, _context: any, callback: any) => {
  const { users, affiliations }: MessagePopulationParams = event.populationParams;
  const foundUsers: UserData[] = [];
  const affiliationStems = affiliations?.map((a) => affiliationLookup[a]).filter(Boolean);

  if (affiliationStems?.length) {
    try {
      const c = new Client({
        host: process.env.GROUPER_HOST?.toString() ?? '',
        username: process.env.GROUPER_USERNAME,
        password: process.env.GROUPER_PASSWORD,
      });

      const foundInGrouper = await getAllMembers(c, affiliationStems ?? []);
      console.debug(`Grouper getAllMembers returned ${foundInGrouper.length}`);
      foundUsers.push(...foundInGrouper);
    } catch (err) {
      console.error('stepGetUserPopulation error when using Grouper API', err);
      throw err;
    }
  }

  // spread users into a new array prevents mutation of original object in getTargetPopulation
  const targetPopulation: UserData[] = getTargetPopulation([...(users ?? [])], foundUsers);
  const key = await copyMessageToS3(event, targetPopulation);
  if (key) {
    callback(null, { s3Data: { bucket: DATA_TRANSFER_BUCKET, key } });
  } else {
    throw new Error(
      'stepGetUserPopulation failed to upload message with target population data to S3.',
    );
  }
};

export default handler;
