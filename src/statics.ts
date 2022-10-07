export abstract class Statics {
  static readonly projectName: string = 'irma-issue-app';
  static readonly sessionTableName: string = 'irma-issue-sessions';

  /**
   * Repo information
   */

  static readonly repository: string = 'irma-issue-app';
  static readonly repositoryOwner: string = 'GemeenteNijmegen';

  /**
   * IAM params
   */
  static readonly iamAccountId: string = '098799052470';
  static readonly ssmReadOnlyRoleArn: string = '/cdk/irma-issue-app/role-readonly-arn';

  /**
   * Authentication URL base, used in auth and login lambda
   */
  static readonly ssmAuthUrlBaseParameter: string = '/cdk/irma-issue-app/authUrlBase';
  /**
   * OpenID Connect client ID (sent in URL as querystring-param, not secret)
   */
  static readonly ssmOIDCClientID: string = '/cdk/irma-issue-app/authClientID';
  /**
   * OpenID Connect scope
   */
  static readonly ssmOIDCScope: string = '/cdk/irma-issue-app/authScope';

  /**
   * OpenID Connect secret name
   */
  static readonly secretOIDCClientSecret: string = '/cdk/irma-issue-app/oidc-clientsecret';

  /**
   * Certificate private key for mTLS
   */
  static readonly secretMTLSPrivateKey: string = '/cdk/irma-issue-app/mtls-privatekey';

  /**
   * Certificate for mTLS
   */
  static readonly ssmMTLSClientCert: string = '/cdk/irma-issue-app/mtls-clientcert';

  /**
    * Root CA for mTLS (PKIO root)
    */
  static readonly ssmMTLSRootCA: string = '/cdk/irma-issue-app/mtls-rootca';

  /**
   * BRP API endpoint
   */
  static readonly ssmBrpApiEndpointUrl: string = '/cdk/irma-issue-app/brp-api-url';


  /**
   * Route53 Zone ID and name for csp-nijmegen.nl in this account.
   * NB: This depends on the eform-project existing and having set this parameter!
   * We need to use this zone for domain validation purposes. We need to be able to
   * set CNAME DNS-records on the main domain.
   *
   * We need both because a lookup using fromHostedZoneId fails when adding new records,
   * this returns an incomplete iHostedZone (without name).
   */
  static readonly cspRootZoneId: string = '/gemeente-nijmegen/formio/hostedzone/id';
  static readonly cspRootZoneName: string = '/gemeente-nijmegen/formFio/hostedzone/name';

  // Managed in dns-managment project:
  // Below references the new hosted zone separeted from webformulieren
  static readonly accountRootHostedZonePath: string = '/gemeente-nijmegen/account/hostedzone';
  static readonly accountRootHostedZoneId: string = '/gemeente-nijmegen/account/hostedzone/id';
  static readonly accountRootHostedZoneName: string = '/gemeente-nijmegen/account/hostedzone/name';
  // The KSM key parameters for each account
  static readonly ssmAccountDnsSecKmsKey: string = '/gemeente-nijmegen/account/dnssec/kmskey/arn';


  /**
   * Route53 Zone ID and name for the zone for IRMA issue app. decouples stacks to not pass
   * the actual zone between stacks. This param is set by DNSStack and should not be modified after.
   */
  static readonly ssmZonePath: string = '/cdk/irma-issue-app/zones';
  static readonly ssmZoneId: string = '/cdk/irma-issue-app/zone-id';
  static readonly ssmZoneName: string = '/cdk/irma-issue-app/zone-name';
  static readonly ssmZoneIdNew: string = '/cdk/irma-issue-app/zones/csp-id';
  static readonly ssmZoneNameNew: string = '/cdk/irma-issue-app/zones/csp-name';

  static readonly certificatePath: string = '/cdk/irma-issue-app/certificates';
  static readonly certificateArn: string = '/cdk/irma-issue-app/certificates/certificate-arn';

  static readonly ssmApiGatewayId: string = '/cdk/irma-issue-app/apigateway-id';

  static readonly ssmSessionsTableArn: string = '/cdk/irma-issue-app/sessionstable-arn';

  static readonly ssmDataKeyArn: string = '/cdk/irma-issue-app/kms-datakey-arn';

  static readonly wafPath: string = '/cdk/irma-issue-app/waf';
  static readonly ssmWafAclArn: string = '/cdk/irma-issue-app/waf/acl-arn';

  static readonly ssmMonitoringLambdaArn: string = '/cdk/irma-issue-app/monitoring-lambda-arn';
  static readonly ssmSlackWebhookUrl: string = '/cdk/irma-issue-app/slack-webhook-url';

  static readonly codeStarConnectionArn: string = 'arn:aws:codestar-connections:eu-west-1:418648875085:connection/4f647929-c982-4f30-94f4-24ff7dbf9766';


  static subDomain(branch: string) {
    const subdomainMap = {
      development: 'irma-issue.sandbox',
      acceptance: 'irma-issue.accp',
      production: 'irma-issue',
    };
    const subdomain = subdomainMap[branch as keyof typeof subdomainMap] ?? 'irma-issue';
    return subdomain;
  }

  static cspSubDomain(branch: string) {
    const subdomainMap = {
      development: 'irma-issue.sandbox',
      acceptance: 'irma-issue.accp',
      production: 'irma-issue.auth-prod',
    };
    const subdomain = subdomainMap[branch as keyof typeof subdomainMap] ?? 'irma-issue.auth-prod';
    return subdomain;
  }
}