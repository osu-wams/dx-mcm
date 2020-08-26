import { parsePhoneNumberFromString, ParseError, isValidNumber } from 'libphonenumber-js';
import { publish } from '@src/messagePubSub';
import { ENV } from '@src/constants';
import Channel, { Environments } from './channel'; // eslint-disable-line no-unused-vars

/**
 * Overview of things to note about phone numbers:
 * libphonenumber-js cannot really parse if there are extraneous characters
 * We really need the phone numbers to have the country code to do anything.
 * For US phone numbers, there is no good way to tell if it's a landline or a cellphone
 * We can send international texts through AWS
 * Apigee phone numbers are typically in +15411234567
 */
class SmsChannel extends Channel {
  toEnvironments = [Environments.Production];

  typeName = 'SmsChannel';

  /**
   * Process then publish the UserMessage to this channel.
   */
  async process() {
    const number = this.userMessage.smsNumber;

    const shortMessage = this.userMessage.contentShort;

    if (number && shortMessage) {
      try {
        let validNumber;

        // It's a valid number in the format we need
        if (isValidNumber(number)) {
          // parsePhoneNumberFromString can return undefined, but we have a valid number above so we don't expect it
          validNumber = parsePhoneNumberFromString(number)!.number.toString();
        }
        // Attempt to format to E164 value and check for validity again
        else {
          // Strip all non numeric characters add a plus to start
          const rawNumber = `+${number.replace(/\D/g, '')}`;
          if (isValidNumber(rawNumber)) {
            validNumber = rawNumber;
          } else {
            // We can't process the phone, so set to empty/false
            throw new Error(`Phone validation failed for: ${number}`);
          }
        }

        const message = {
          Message: shortMessage,
          PhoneNumber: validNumber,
        };
        console.debug(`UserMessage sent via SMS:`, message);

        if (this.toEnvironments.some((e) => e === ENV.toLowerCase())) {
          await publish(message);
          await super.publish();
        } else {
          console.info(
            `${this.typeName}#publish : toEnvironments[${this.toEnvironments.join(
              ',',
            )}] did not include ${ENV}, SMS and UserMessage will not be delivered. If this is unexpected, updated ${
              this.typeName
            }.toEnvironments to include the missing value and reprocess messages.`,
          );
        }
      } catch (error) {
        if (error instanceof ParseError) {
          // Not a phone number, non-existent country, etc.
          console.error(`Phone: ${number} had a an error:${error.message}`);
        } else {
          console.error('Full error:', error);
        }
        throw error;
      }
    }
  }
}

export default SmsChannel;
