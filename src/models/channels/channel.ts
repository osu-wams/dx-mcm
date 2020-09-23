import Deliverable from '@src/models/channels/deliverable';
import { applyMixins } from '@src/models/utils';
import UserMessage, { compositeKey } from '@src/models/userMessage'; // eslint-disable-line no-unused-vars
import { ENV } from '@src/constants';

export enum Environments {
  Development = 'development', // eslint-disable-line no-unused-vars
  Stage = 'stage', // eslint-disable-line no-unused-vars
  Production = 'production', // eslint-disable-line no-unused-vars
}

interface Channel extends Deliverable {}

class Channel {
  userMessage: UserMessage;

  toEnvironments: Environments[] = [Environments.Development];

  typeName: string = 'Channel';

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
      `Base class ${this.typeName}#process called when it should be overridden by the subclass for (${this.userMessage.channelId}), unable to proceed.`,
    );
  }

  /**
   * Mark the UserMessage as having been delivered and update the record in the database.
   */
  async publish() {
    if (this.toEnvironments.some((e) => e === ENV.toLowerCase())) {
      this.setDelivered();
      this.userMessage.deliveredAt = this.deliveredAt;
      this.userMessage.status = this.deliveredStatus!;
      this.userMessage.channelDeliveredAt = compositeKey([
        this.userMessage.channelId,
        this.deliveredAt!,
      ]);
      await UserMessage.upsert(this.userMessage);
    } else {
      console.info(
        `${this.typeName}#publish : toEnvironments[${this.toEnvironments.join(
          ',',
        )}] did not include ${ENV}, UserMessage will not be delivered. If this is unexpected, updated ${
          this.typeName
        }.toEnvironments to include the missing value and reprocess messages.`,
      );
      throw new Error(`Disallowed publishing to ${this.typeName} in ${ENV}.`);
    }
  }
}

applyMixins(Channel, [Deliverable]);

export default Channel;
