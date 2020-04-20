import Deliverable from '@src/models/channels/deliverable';
import applyMixins from '@src/models/utils';
import UserMessage from '@src/models/userMessage'; // eslint-disable-line no-unused-vars

interface Channel extends Deliverable {}

class Channel {
  userMessage: UserMessage;

  constructor(userMessage: UserMessage) {
    this.userMessage = userMessage;
    this.deliveredAt = userMessage.deliveredAt;
  }

  /**
   * Process the UserMessage through the Channel.
   * ! This method must be overridden by the subclass to ensure proper handling of the message
   * ! happens for the target channel.
   */
  async process() {
    throw new Error(
      `Base class Channel#process called when it should be overridden by the subclass for (${this.userMessage.channelId}), unable to proceed.`,
    );
  }

  /**
   * Mark the UserMessage as having been delivered and update the record in the database.
   */
  async publish() {
    this.deliver();
    this.userMessage.deliveredAt = this.deliveredAt;
    this.userMessage.status = this.deliveredStatus!;
    await UserMessage.upsert(this.userMessage);
  }
}

applyMixins(Channel, [Deliverable]);

export default Channel;
