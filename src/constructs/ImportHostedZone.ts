import { aws_route53 as Route53 } from 'aws-cdk-lib';
import { RemoteParameters } from 'cdk-remote-stack';
import { Construct } from 'constructs';
import { Statics } from '../statics';

export class ImportHostedZone extends Construct {

  hostedZone: Route53.IHostedZone;

  constructor(scope: Construct, id: string) {
    super(scope, id);
    this.hostedZone = this.importProjectHostedZone();
  }

  importProjectHostedZone() {
    // Import attrubutes from eu-west-1
    const parameters = new RemoteParameters(this, 'remote-parameters', {
      path: Statics.ssmZonePath,
      region: 'eu-west-1',
    });
    const zoneId = parameters.get(Statics.ssmZoneId);
    const zoneName = parameters.get(Statics.ssmZoneName);
    // Import and return the hosted zone
    return Route53.HostedZone.fromHostedZoneAttributes(this, 'imported-zone', {
      hostedZoneId: zoneId,
      zoneName: zoneName,
    });
  }
}