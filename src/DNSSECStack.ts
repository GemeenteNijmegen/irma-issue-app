import { aws_route53 as Route53, Stack, StackProps, aws_ssm as SSM } from 'aws-cdk-lib';
import { RemoteParameters } from 'cdk-remote-stack';
import { Construct } from 'constructs';
import { DnssecRecordStruct } from './dnssec-record/dnssec-record-struct';
import { Statics } from './statics';

export class DNSSECStack extends Stack {
  /**
     * Add DNSSEC using a new KMS key to the domain.
     * The key needs to be created in us-east-1. It only adds
     * DNSSEC to the zone for this project. The parent zone needs
     * to have DNSSEC enabled as well.
     *
     * @param scope Construct
     * @param id stack id
     * @param props props object
     */
  constructor(scope: Construct, id: string, props: StackProps) {
    super(scope, id, props);

    // Import account root hosted zone
    const rootZoneParams = new RemoteParameters(this, 'root-zone-params', {
      path: Statics.accountRootHostedZonePath,
      region: 'eu-west-1',
    });
    const accountRootZone = Route53.HostedZone.fromHostedZoneAttributes(this, 'account-root-zone', {
      hostedZoneId: rootZoneParams.get(Statics.accountRootHostedZoneId),
      zoneName: rootZoneParams.get(Statics.accountRootHostedZoneName),
    });

    // Import project hosted zone
    const zoneParams = new RemoteParameters(this, 'zone-params', {
      path: Statics.ssmZonePath,
      region: 'eu-west-1',
    });
    const zone = Route53.HostedZone.fromHostedZoneAttributes(this, 'zone', {
      hostedZoneId: zoneParams.get(Statics.ssmZoneId),
      zoneName: zoneParams.get(Statics.ssmZoneName),
    });

    // Setup DNSSEC
    this.setDNSSEC(zone, accountRootZone);
  }

  setDNSSEC(hostedZone: Route53.IHostedZone, accountRootZone: Route53.IHostedZone) {

    // KSK
    const accountDnssecKmsKeyArn = SSM.StringParameter.valueForStringParameter(this, Statics.ssmAccountDnsSecKmsKey);
    const dnssecKeySigning = new Route53.CfnKeySigningKey(this, 'dnssec-keysigning-key', {
      name: 'irma_issue_ksk',
      status: 'ACTIVE',
      hostedZoneId: hostedZone.hostedZoneId,
      keyManagementServiceArn: accountDnssecKmsKeyArn,
    });

    // Enable DNSSEC
    const dnssec = new Route53.CfnDNSSEC(this, 'dnssec', {
      hostedZoneId: hostedZone.hostedZoneId,
    });
    dnssec.node.addDependency(dnssecKeySigning);

    // DS record
    const dnssecRecord = new DnssecRecordStruct(this, 'dnssec-record', {
      keySigningKey: dnssecKeySigning,
      hostedZone: hostedZone,
      parentHostedZone: accountRootZone,
    });
    dnssecRecord.node.addDependency(dnssec);

  }

}