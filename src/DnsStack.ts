import * as cdk from 'aws-cdk-lib';
import { aws_route53 as Route53, aws_ssm as SSM } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { Statics } from './Statics';

export interface DnsStackProps extends cdk.StackProps {
  branch: string;
}

export class DnsStack extends cdk.Stack {
  accountRootZone: Route53.IHostedZone;
  zone: Route53.IHostedZone;
  subdomain: string;

  constructor(scope: Construct, id: string, props: DnsStackProps) {
    super(scope, id);

    // Get the subdomain name based on the branch
    this.subdomain = Statics.subDomain(props.branch);

    // Import the csp-nijmegen.nl hosted zone for the current aws account.
    // Note: On the accounts auth-accp and auth-prod these parameters point to accp.csp-nijmegen.nl and csp-nijmegen.nl respectively.
    const rootZoneId = SSM.StringParameter.valueForStringParameter(this, Statics.envRootHostedZoneIdOld);
    const rootZoneName = SSM.StringParameter.valueForStringParameter(this, Statics.envRootHostedZoneNameOld);
    this.accountRootZone = Route53.HostedZone.fromHostedZoneAttributes(this, 'account-root-hostedzone', {
      hostedZoneId: rootZoneId,
      zoneName: rootZoneName,
    });

    // Define the new subdomain zone
    this.zone = new Route53.HostedZone(this, 'irma-issue-subdomain', {
      zoneName: `${this.subdomain}.${this.accountRootZone.zoneName}`,
    });

    // Export properties for importing the hosted zone in other stacks of this app
    new SSM.StringParameter(this, 'irma-issue-subdomain-zone-id', {
      parameterName: Statics.hostedZoneId,
      stringValue: this.zone.hostedZoneId,
    });
    new SSM.StringParameter(this, 'irma-issue-subdomain-zone-name', {
      parameterName: Statics.hostedZoneName,
      stringValue: this.zone.zoneName,
    });

    // Register the subdomain in the imported hosted zone
    if (this.zone.hostedZoneNameServers == undefined){
      throw 'Could not setup subdomain for this environment as the name servers are undefined for this hosted zone';
    }
    new Route53.ZoneDelegationRecord(this, 'irma-issue-zone-delegation', {
      nameServers: this.zone.hostedZoneNameServers,
      zone: this.accountRootZone
    })

    // TODO: set validation headers for a certificate
    // TODO: set DNSSEC

  }

}