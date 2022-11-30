
import {
  Route53Client,
  GetDNSSECCommand,
  ChangeResourceRecordSetsCommand,
  GetChangeCommand,
  ChangeStatus,
} from '@aws-sdk/client-route-53';

export class DnssecRecordUtil {

  private route53Client;

  constructor(client: Route53Client) {
    this.route53Client = client;
  }

  /**
   * Will search the hosted zone for active KeySigningKeys and
   * returns the DS record value from the first active KSK found.
   * @param hostedZoneId
   * @returns
   */
  async getDsRecordValue(hostedZoneId: string) {
    // Obtain DNSSEC status from hosted zone
    const dnssecCommand = new GetDNSSECCommand({
      HostedZoneId: hostedZoneId,
    });
    const dnssecInfo = await this.route53Client.send(dnssecCommand);

    // Find a valid key signing key
    const keySigningKey = dnssecInfo.KeySigningKeys?.find(k => k.Status == 'ACTIVE');
    if (!keySigningKey) {
      console.error('Could not find an (active) KSK: ', JSON.stringify(dnssecInfo.KeySigningKeys));
      throw Error('Could not find an (active) KeySignigKey (see logging for more details)');
    }

    // Get the record value
    const dsRecordValue = keySigningKey.DSRecord;
    if (!dsRecordValue) {
      throw Error(`Value: ${dsRecordValue} is not a valid DS record value`);
    }

    return dsRecordValue;
  }


  /**
   * Tries to delete the DS record in the paren hosted zone
   * Note: chances are that this does not work as all values must be the same...
   * @param parentHostedZoneId
   * @param dsRecordName
   * @param dsRecordValue
   */
  async createDsRecord(parentHostedZoneId: string, dsRecordName: string, dsRecordValue: string) {
    const createRecordCommand = new ChangeResourceRecordSetsCommand({
      HostedZoneId: parentHostedZoneId, // Parent hosted zone!
      ChangeBatch: {
        Comment: 'Create DS record in hosted zone',
        Changes: [
          {
            Action: 'UPSERT', // Create if not exist update otherwise
            ResourceRecordSet: {
              Name: dsRecordName, // this should be hosted zone name (in the parent)
              Type: 'DS',
              ResourceRecords: [
                { Value: dsRecordValue },
              ],
              TTL: 3600, // Can be increased probably
            },
          },
        ],
      },
    });
    const createRecordResult = await this.route53Client.send(createRecordCommand);

    const changeId = createRecordResult.ChangeInfo?.Id;
    if (!changeId) {
      throw Error('No change ID returned while creating record');
    }

    return changeId;
  }


  /**
   * Wait for a chagne to be INSYNC
   * @param changeId
   * @param maxRetries
   * @param intervalMilis
   * @returns
   */
  async waitForChange(changeId: string, maxRetries: number, intervalMilis: number) {

    let retries = 0;
    while (retries <= maxRetries) {
      retries++;

      // Check if change is INSYNC
      const changeStatusCommand = new GetChangeCommand({
        Id: changeId,
      });
      const status = await this.route53Client.send(changeStatusCommand);

      if (status.ChangeInfo?.Status == ChangeStatus.INSYNC) {
        return true;
      }

      await this.sleep(intervalMilis);
    }
    return false;
  }

  private async sleep(millis: number) {
    return new Promise(resolve => setTimeout(resolve, millis));
  }

}