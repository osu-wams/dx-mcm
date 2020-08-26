import Channel, { Environments } from './channel'; // eslint-disable-line no-unused-vars

class DashboardChannel extends Channel {
  toEnvironments = [Environments.Development, Environments.Stage, Environments.Production];

  typeName = 'DashboardChannel';

  /**
   * Process then publish the UserMessage to this channel.
   */
  async process() {
    console.debug(
      `UserMessage published to ${this.typeName} is a no-op, marking message as delivered and updating record.`,
    );
    await super.publish();
  }
}

export default DashboardChannel;
