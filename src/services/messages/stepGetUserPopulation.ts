export const handler = async (event: any, _context: any, callback: any) => {
  const { osuIds } = event.populationParams;

  // TODO: With the provided event.populationParams, lookup all of the osuId's that match
  let foundIds: string[] = [];

  if (osuIds) foundIds = foundIds.concat(osuIds);

  // Return a unique array of ids by spreading a Set
  callback(null, { users: [...new Set(foundIds)] });
};

export default handler;
