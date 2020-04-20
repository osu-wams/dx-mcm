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

  async publish() {
    this.deliver();
    this.userMessage.deliveredAt = this.deliveredAt;
    this.userMessage.status = this.deliveredStatus!;
    console.log(this.userMessage);
    await UserMessage.upsert(this.userMessage);
  }
}

applyMixins(Channel, [Deliverable]);

export default Channel;
