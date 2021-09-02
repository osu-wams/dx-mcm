import axios from 'axios';
import { Status } from '@src/models/message';
import { DX_ALERTS_TEAMS_HOOK, ENV, USER_MESSAGE_API_URL } from '@src/constants';
import UserMessagePending from '@src/models/userMessagePending';

const fetchErrors = async (pendingMinAgo: number): Promise<UserMessagePending[]> => {
  const items: UserMessagePending[] = [];
  let lastKey: string | undefined;
  do {
    // eslint-disable-next-line no-await-in-loop
    const results = await UserMessagePending.updatedSince(Status.ERROR, pendingMinAgo, lastKey);
    if (results.lastKey) lastKey = results.lastKey;
    items.push(...results.items);
  } while (lastKey);

  items.forEach(({ id, channelMessageId, status, updatedAt, sendAt, statusMessage }) =>
    console.error(`UserMessage: (${id} / ${channelMessageId}) is in ${status} state.`, {
      id,
      channelMessageId,
      sendAt,
      status,
      updatedAt,
      statusMessage,
    }),
  );
  return items;
};

const getStatusMessages = (items: UserMessagePending[]): (string | undefined)[] => {
  return [...new Set(items.map((i) => i.statusMessage))];
};

// eslint-disable-next-line no-unused-vars
export const handler = async (_event: any, _context: any, _callback: any) => {
  const pendingMinAgo = parseInt((process.env.PENDING_MIN_AGO ?? '1').toString(), 10);
  const fromDate = new Date(Date.now() - pendingMinAgo).toISOString().slice(0, 16);
  const items = await fetchErrors(pendingMinAgo);

  if (items.length) {
    const divider = { type: 'divider' };
    const title = {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*MCM UserMessage Monitor* : ${ENV} since ${fromDate}\nErrors: ${items.length}`,
      },
    };
    const data: { blocks: { type: string; text?: { type: string; text: string } }[] } = {
      blocks: [title],
    };
    const statusMessages = getStatusMessages(items);
    statusMessages.forEach((s) => {
      const text = items
        .filter((i) => i.statusMessage === s)
        .map(
          (i) =>
            `${i.messageChannelUser} : <${USER_MESSAGE_API_URL}/error/${encodeURIComponent(
              i.messageChannelUser,
            )}|view> | <${USER_MESSAGE_API_URL}/error/${encodeURIComponent(
              i.messageChannelUser,
            )}/retry|retry>`,
        )
        .join('\n');
      const itemDetail = { type: 'section', text: { type: 'mrkdwn', text } };
      const context = {
        type: 'context',
        elements: [{ type: 'mrkdwn', text: `:memo: Error: ${s}` }],
      };
      data.blocks.push(divider, context, itemDetail);
    });

    const curlContext = {
      type: 'context',
      elements: [
        { type: 'mrkdwn', text: ':robot_face: Retry delivering all messages in this notification' },
      ],
    };
    const ids = items.map((i) => `"${i.messageChannelUser}"`).join(',');
    const curlCommand = {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `\`\`\`\ncurl --header "Content-Type: application/json" -X POST -d '{"ids": [${ids}]}' ${USER_MESSAGE_API_URL}/error/retry\n\`\`\``,
      },
    };
    data.blocks.push(curlContext, curlCommand);
    await axios.post(DX_ALERTS_TEAMS_HOOK, data, {
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

export default handler;
