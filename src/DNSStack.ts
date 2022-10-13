import { aws_route53 as Route53, Stack, StackProps, aws_ssm as SSM, Duration } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { Statics } from './statics';

export interface DNSStackProps extends StackProps {
  branch: string;
}

export class DNSStack extends Stack {
  zone: Route53.HostedZone;
  accountRootZone: Route53.IHostedZone;
  branch: string;

  constructor(scope: Construct, id: string, props: DNSStackProps) {
    super(scope, id);
    this.branch = props.branch;

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
    this.addDsRecord();

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

  /**
   * Add DS record for the zone to the parent zone
   * to establish a chain of trust (https://docs.aws.amazon.com/Route53/latest/DeveloperGuide/dns-configuring-dnssec-enable-signing.html#dns-configuring-dnssec-chain-of-trust)
   */
  addDsRecord() {
    let dsValue = '';
    switch (this.branch) {
      case 'acceptance':
        dsValue = '52561 13 2 EBD9ED03EC245E70D458F7B300606FB1DBB3C6D185E19EDB835FBC47B396530A'; // TODO manually removed so add again when deploying DNSSEC stack to accp again
        break;
      case 'production':
        dsValue = '60066 13 2 932CD585B029E674E17C4C33DFE7DE2C84353ACD8C109760FD17A6CDBD0CF3FA'; // TODO fix in prod
        break;
      default:
        break;
    }

    if (dsValue) {
      new Route53.DsRecord(this, 'ds-record', {
        zone: this.accountRootZone,
        recordName: 'irma-issue',
        values: [dsValue],
        ttl: Duration.seconds(600),
      });
    }
  }


  addValidationRecords() {
    if (this.branch == 'development') {
      new Route53.CnameRecord(this, 'cert-validation', {
        zone: this.zone,
        recordName: '_6eb18be87b93dbe7198d40b1b494cc77',
        domainName: '_f66e3a74179a85d88a329a5bc2b91548.bcnrdwzwjt.acm-validations.aws',
      });
    } else if (this.branch == 'acceptance') {
      new Route53.CnameRecord(this, 'cert-validation', {
        zone: this.zone,
        recordName: '_b1177264f99d12c8a536233355add646',
        domainName: '_3f065e537a8e4c0cb070d5004c0388e2.bcnrdwzwjt.acm-validations.aws.',
      });
    } else if (this.branch == 'production') {
      new Route53.CnameRecord(this, 'cert-validation', { // TODO fill
        zone: this.zone,
        recordName: '',
        domainName: '',
      });
    }
  }

}