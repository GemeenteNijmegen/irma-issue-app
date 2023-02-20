import { Stage, StageProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { ApiStack } from './ApiStack';
import { CloudfrontStack } from './CloudfrontStack';
import { Configurable, Configuration } from './Configuration';
import { DashboardStack } from './DashboardStack';
import { DNSSECStack } from './DNSSECStack';
import { DNSStack } from './DNSStack';
import { KeyStack } from './keystack';
import { SessionsStack } from './SessionsStack';
import { UsEastCertificateStack } from './UsEastCertificateStack';
import { WafStack } from './WafStack';

export interface ApiStageProps extends StageProps, Configurable {}

/**
 * Stage responsible for the API Gateway and lambdas
 */
export class ApiStage extends Stage {

  readonly configuration: Configuration;

  constructor(scope: Construct, id: string, props: ApiStageProps) {
    super(scope, id, props);
    this.configuration = props.configuration;

    const keyStack = new KeyStack(this, 'key-stack');
    const sessionsStack = new SessionsStack(this, 'sessions-stack', { key: keyStack.key }); // TODO fix this stack dependency
    const dnsStack = new DNSStack(this, 'dns-stack');

    const usEastCertificateStack = new UsEastCertificateStack(this, 'us-cert-stack', {
      env: { region: 'us-east-1' },
      configuration: this.configuration,
    });
    usEastCertificateStack.addDependency(dnsStack);

    const dnssecStack = new DNSSECStack(this, 'dnssec-stack', {
      env: { region: 'us-east-1' },
      configuration: this.configuration,
    });
    dnssecStack.addDependency(dnsStack);

    const apistack = new ApiStack(this, 'api-stack', {
      sessionsTable: sessionsStack.sessionsTable,
      configuration: this.configuration,
    });

    const cloudfrontStack = new CloudfrontStack(this, 'cloudfront-stack', {
      apiGatewayDomain: apistack.domain(),
      configuration: this.configuration,
    });
    cloudfrontStack.addDependency(usEastCertificateStack);

    const dashboardStack = new DashboardStack(this, 'dashboard-stack');
    dashboardStack.addDependency(apistack, 'Uses a log group form a lambda in the apiStack');

    const waf = new WafStack(this, 'waf-stack', {
      env: { region: 'us-east-1' },
      configuration: this.configuration,
    });
    waf.addDependency(apistack);

  }
}