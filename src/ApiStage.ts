import { Stage, StageProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { ApiStack } from './ApiStack';
import { CloudfrontStack } from './CloudfrontStack';
import { DashboardStack } from './DashboardStack';
import { DNSSECStack } from './DNSSECStack';
import { DNSStack } from './DNSStack';
import { KeyStack } from './keystack';
import { SessionsStack } from './SessionsStack';
import { UsEastCertificateStack } from './UsEastCertificateStack';
import { WafStack } from './WafStack';

export interface ApiStageProps extends StageProps {
  branch: string;
  addNijmegenDomain: boolean;
}

/**
 * Stage responsible for the API Gateway and lambdas
 */
export class ApiStage extends Stage {
  constructor(scope: Construct, id: string, props: ApiStageProps) {
    super(scope, id, props);

    // Only deploy key on accp and prod
    var key = undefined;
    if (props.branch != 'development') {
      const keyStack = new KeyStack(this, 'key-stack');
      key = keyStack.key;
    }

    const sessionsStack = new SessionsStack(this, 'sessions-stack', { key: key });
    const dnsStack = new DNSStack(this, 'dns-stack', { branch: props.branch });

    const usEastCertificateStack = new UsEastCertificateStack(this, 'us-cert-stack', {
      branch: props.branch,
      env: { region: 'us-east-1' },
      addNijmegenDomain: props.addNijmegenDomain,
    });
    usEastCertificateStack.addDependency(dnsStack);

    // Only deploy DNSSEC on accp and prod
    if (props.branch != 'development') {
      const dnssecStack = new DNSSECStack(this, 'dnssec-stack', { env: { region: 'us-east-1' } });
      dnssecStack.addDependency(dnsStack);
    }

    const apistack = new ApiStack(this, 'api-stack', {
      branch: props.branch,
      sessionsTable: sessionsStack.sessionsTable,
      addNijmegenDomain: props.addNijmegenDomain,
    });
    const cloudfrontStack = new CloudfrontStack(this, 'cloudfront-stack', {
      branch: props.branch,
      hostDomain: apistack.domain(),
      addNijmegenDomain: props.addNijmegenDomain,
    });
    cloudfrontStack.addDependency(usEastCertificateStack);

    const dashboardStack = new DashboardStack(this, 'dashboard-stack');
    dashboardStack.addDependency(apistack, 'Uses a log group form a lambda in the apiStack');

    // Only deploy WAF on accp and prod
    if (props.branch != 'development') {
      const waf = new WafStack(this, 'waf-stack', { env: { region: 'us-east-1' }, branch: props.branch });
      waf.addDependency(apistack);
    }
  }
}