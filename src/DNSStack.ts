import { aws_route53 as Route53, Stack, StackProps, aws_ssm as SSM } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { Configurable } from './Configuration';
import { Statics } from './statics';

export interface DNSStackProps extends StackProps, Configurable {}

export class DNSStack extends Stack {
  zone: Route53.HostedZone;
  accountRootZone: Route53.IHostedZone;

  constructor(scope: Construct, id: string, _props?: DNSStackProps) {
    super(scope, id);

    const rootZoneId = SSM.StringParameter.valueForStringParameter(this, Statics.accountRootHostedZoneId);
    const rootZoneName = SSM.StringParameter.valueForStringParameter(this, Statics.accountRootHostedZoneName);
    this.accountRootZone = Route53.HostedZone.fromHostedZoneAttributes(this, 'account-root-zone', {
      hostedZoneId: rootZoneId,
      zoneName: rootZoneName,
    });

    this.zone = new Route53.HostedZone(this, 'hosted-zone', {
      zoneName: `irma-issue.${this.accountRootZone.zoneName}`,
    });

    this.addZoneIdAndNametoParams();
    this.addNSToRootCSPzone();

  }

  /**
   * Export zone id and name to parameter store
   * for use in other stages (Cloudfront).
   */
  private addZoneIdAndNametoParams() {
    new SSM.StringParameter(this, 'hostedzone-id', {
      stringValue: this.zone.hostedZoneId,
      parameterName: Statics.ssmZoneId,
    });

    new SSM.StringParameter(this, 'hostedzone-name', {
      stringValue: this.zone.zoneName,
      parameterName: Statics.ssmZoneName,
    });
  }

  /**
   * Add the Name servers from the newly defined zone to
   * the root zone for csp-nijmegen.nl. This will only
   * have an actual effect in the prod. account.
   *
   * @returns null
   */
  addNSToRootCSPzone() {
    if (!this.zone.hostedZoneNameServers) { return; }
    new Route53.NsRecord(this, 'ns-record', {
      zone: this.accountRootZone,
      values: this.zone.hostedZoneNameServers,
      recordName: 'irma-issue',
    });
  }

}