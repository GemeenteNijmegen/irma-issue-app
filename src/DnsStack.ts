import * as cdk from 'aws-cdk-lib';
import { aws_route53 as Route53, aws_ssm as SSM } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { Statics } from './Statics';

export interface DnsStackProps extends cdk.StackProps {
  branch: string;
}

export class DnsStack extends cdk.Stack {
  cspRootZone: Route53.IHostedZone;
  zone: Route53.IHostedZone;
  subdomain: string;

  constructor(scope: Construct, id: string, props: DnsStackProps) {
    super(scope, id);

    // Get the subdomain name based on the branch
    this.subdomain = Statics.subDomain(props.branch);

    // Import the csp-nijmegen.nl hosted zone for this aws account.
    // Note: On the accounts auth-accp and auth-prod these parameters point to accp.csp-nijmegen.nl and csp-nijmegen.nl respectively.
    const rootZoneId = SSM.StringParameter.valueForStringParameter(this, Statics.envRootHostedZoneId);
    const rootZoneName = SSM.StringParameter.valueForStringParameter(this, Statics.envRootHostedZoneName);
    this.cspRootZone = Route53.HostedZone.fromHostedZoneAttributes(this, 'account-root-hostedzone', {
      hostedZoneId: rootZoneId,
      zoneName: rootZoneName,
    });

    // Define the new subdomain zone
    this.zone = new Route53.HostedZone(this, 'irma-issue-subdomain', {
      zoneName: `${this.subdomain}.${this.cspRootZone.zoneName}`,
    });

    // Export properties for importing the hosted zone in other stacks
    new SSM.StringParameter(this, 'irma-issue-subdomain-zone-id', {
      parameterName: Statics.hostedZoneId,
      stringValue: this.zone.hostedZoneId,
    });
    new SSM.StringParameter(this, 'irma-issue-subdomain-zone-name', {
      parameterName: Statics.hostedZoneName,
      stringValue: this.zone.zoneName,
    });

    this.addNameServersToRootZone();

    // TODO: set validation headers for a certificate
    // TODO: set DNSSEC

  }

  /**
     * Add the name servers of the new subdomain zone to
     * the root zone that is configured for this environment
     * @returns null
     */
  addNameServersToRootZone() {
    if (!this.zone.hostedZoneNameServers) { return; }
    new Route53.NsRecord(this, 'ns-record', {
      zone: this.cspRootZone,
      values: this.zone.hostedZoneNameServers,
      recordName: this.subdomain,
    });
  }

}