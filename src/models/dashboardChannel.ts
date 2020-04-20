import Channel from '@src/models/channels/channel'; // eslint-disable-line no-unused-vars

class DashboardChannel extends Channel {
  /**
   * Process then publish the UserMessage to this channel.
   */
  async process() {
    console.debug(
      'UserMessage published to Dashboard is a no-op, marking message as delivered and updating record.',
    );
    await super.publish();
  }
}

export default DashboardChannel;
