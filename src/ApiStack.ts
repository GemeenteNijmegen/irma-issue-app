import * as apigatewayv2 from '@aws-cdk/aws-apigatewayv2-alpha';
import { HttpLambdaIntegration } from '@aws-cdk/aws-apigatewayv2-integrations-alpha';
import { aws_secretsmanager, Stack, StackProps, aws_ssm as SSM } from 'aws-cdk-lib';
import { Table } from 'aws-cdk-lib/aws-dynamodb';
import { AccountPrincipal, PrincipalWithConditions, Role } from 'aws-cdk-lib/aws-iam';
import { RetentionDays } from 'aws-cdk-lib/aws-logs';
import { Construct } from 'constructs';
import { ApiFunction } from './ApiFunction';
import { AuthFunction } from './app/auth/auth-function';
import { CallbackFunction } from './app/callback/callback-function';
import { IssueFunction } from './app/issue/issue-function';
import { LoginFunction } from './app/login/login-function';
import { LogoutFunction } from './app/logout/logout-function';
import { Configurable } from './Configuration';
import { DynamoDbReadOnlyPolicy } from './iam/dynamodb-readonly-policy';
import { SessionsTable } from './SessionsTable';
import { Statics } from './statics';
import { AppDomainUtil } from './Util';

export interface ApiStackProps extends StackProps, Configurable {
  sessionsTable: SessionsTable;
}

/**
 * The API Stack creates the API Gateway and related
 * lambda's. It requires supporting resources (such as the
 * DynamoDB sessions table to be provided and thus created first)
 */
export class ApiStack extends Stack {

  private sessionsTable: Table;
  api: apigatewayv2.HttpApi;

  constructor(scope: Construct, id: string, props: ApiStackProps) {
    super(scope, id);

    this.sessionsTable = props.sessionsTable.table;

    this.api = new apigatewayv2.HttpApi(this, 'yivi-issue-api', {
      description: 'YIVI issue webapplicatie',
    });

    // Store apigateway ID to be used in other stacks
    new SSM.StringParameter(this, 'ssm_api_1', {
      stringValue: this.api.httpApiId,
      parameterName: Statics.ssmApiGatewayId,
    });

    // Get the base url
    const zoneName = SSM.StringParameter.valueForStringParameter(this, Statics.ssmZoneName);
    const baseUrl = AppDomainUtil.getBaseUrl(props.configuration, zoneName);

    // this.monitoringLambda();
    const readOnlyRole = this.readOnlyRole();
    this.setFunctions(props, baseUrl, readOnlyRole);
    this.allowReadAccessToTable(readOnlyRole, this.sessionsTable);
  }

  /**
   * Create and configure lambda's for all api routes, and
   * add routes to the gateway.
   * @param {string} baseUrl the application url
   */
  setFunctions(props: ApiStackProps, baseUrl: string, readOnlyRole: Role) {

    // See https://docs.aws.amazon.com/AmazonCloudWatch/latest/monitoring/Lambda-Insights-extension-versionsx86-64.html
    const insightsArn = `arn:aws:lambda:${this.region}:580247275435:layer:LambdaInsightsExtension:16`;


    const authBaseUrl = SSM.StringParameter.fromStringParameterName(this, 'ssm-auth-base-url', Statics.ssmAuthUrlBaseParameter);
    const odicClientId = SSM.StringParameter.fromStringParameterName(this, 'ssm-odic-client-id', Statics.ssmOIDCClientID);
    const oidcScope = SSM.StringParameter.fromStringParameterName(this, 'ssm-odic-scope', Statics.ssmOIDCScope);

    const loginFunction = new ApiFunction(this, 'yivi-issue-login-function', {
      description: 'Login-pagina voor de YIVI issue-applicatie.',
      table: this.sessionsTable,
      tablePermissions: 'ReadWrite',
      applicationUrlBase: baseUrl,
      readOnlyRole,
      lambdaInsightsExtensionArn: insightsArn,
    }, LoginFunction);
    authBaseUrl.grantRead(loginFunction.lambda);
    odicClientId.grantRead(loginFunction.lambda);
    oidcScope.grantRead(loginFunction.lambda);

    const logoutFunction = new ApiFunction(this, 'yivi-issue-logout-function', {
      description: 'Uitlog-pagina voor de YIVI issue-applicatie.',
      table: this.sessionsTable,
      tablePermissions: 'ReadWrite',
      applicationUrlBase: baseUrl,
      readOnlyRole,
      lambdaInsightsExtensionArn: insightsArn,
    }, LogoutFunction);

    const oidcSecret = aws_secretsmanager.Secret.fromSecretNameV2(this, 'oidc-secret', Statics.secretOIDCClientSecret);
    const authFunction = new ApiFunction(this, 'yivi-issue-auth-function', {
      description: 'Authenticatie-lambd voor de YIVI issue-applicatie.',
      table: this.sessionsTable,
      tablePermissions: 'ReadWrite',
      applicationUrlBase: baseUrl,
      readOnlyRole,
      environment: {
        CLIENT_SECRET_ARN: oidcSecret.secretArn,
      },
      lambdaInsightsExtensionArn: insightsArn,
    }, AuthFunction);
    oidcSecret.grantRead(authFunction.lambda);
    authBaseUrl.grantRead(loginFunction.lambda);
    odicClientId.grantRead(loginFunction.lambda);
    oidcScope.grantRead(loginFunction.lambda);

    const secretMTLSPrivateKey = aws_secretsmanager.Secret.fromSecretNameV2(this, 'tls-key-secret', Statics.secretMTLSPrivateKey);
    const tlskeyParam = SSM.StringParameter.fromStringParameterName(this, 'tlskey', Statics.ssmMTLSClientCert);
    const tlsRootCAParam = SSM.StringParameter.fromStringParameterName(this, 'tlsrootca', Statics.ssmMTLSRootCA);
    const secretYiviApiAccessKeyId = aws_secretsmanager.Secret.fromSecretNameV2(this, 'yivi-api-access-key', Statics.secretYiviApiAccessKeyId);
    const secretYiviApiSecretKey = aws_secretsmanager.Secret.fromSecretNameV2(this, 'yivi-api-secret-key', Statics.secretYiviApiSecretKey);
    const secretYiviApiKey = aws_secretsmanager.Secret.fromSecretNameV2(this, 'yivi-api-key', Statics.secretYiviApiKey);
    const yiviApiHost = SSM.StringParameter.fromStringParameterName(this, 'yivi-api-host', Statics.ssmYiviApiHost);
    const brpApiUrl = SSM.StringParameter.fromStringParameterName(this, 'brp-api-url', Statics.ssmBrpApiEndpointUrl);
    const issueFunction = new ApiFunction(this, 'yivi-issue-issue-function', {
      table: this.sessionsTable,
      tablePermissions: 'ReadWrite',
      applicationUrlBase: baseUrl,
      readOnlyRole,
      description: 'Home-lambda voor de YIVI issue-applicatie.',
      environment: {
        MTLS_PRIVATE_KEY_ARN: secretMTLSPrivateKey.secretArn,
        MTLS_CLIENT_CERT_NAME: Statics.ssmMTLSClientCert,
        MTLS_ROOT_CA_NAME: Statics.ssmMTLSRootCA,
        BRP_API_URL: Statics.ssmBrpApiEndpointUrl,
        YIVI_API_HOST: Statics.ssmYiviApiHost,
        YIVI_API_DEMO: props.configuration.useDemoScheme ? 'demo': '',
        YIVI_API_ACCESS_KEY_ID_ARN: secretYiviApiAccessKeyId.secretArn,
        YIVI_API_SECRET_KEY_ARN: secretYiviApiSecretKey.secretArn,
        YIVI_API_KEY_ARN: secretYiviApiKey.secretArn,
      },
      lambdaInsightsExtensionArn: insightsArn,
    }, IssueFunction);
    yiviApiHost.grantRead(issueFunction.lambda);
    brpApiUrl.grantRead(issueFunction.lambda);
    secretMTLSPrivateKey.grantRead(issueFunction.lambda);
    tlskeyParam.grantRead(issueFunction.lambda);
    tlsRootCAParam.grantRead(issueFunction.lambda);
    secretYiviApiAccessKeyId.grantRead(issueFunction.lambda);
    secretYiviApiSecretKey.grantRead(issueFunction.lambda);
    secretYiviApiKey.grantRead(issueFunction.lambda);

    const diversifiyer = SSM.StringParameter.valueForStringParameter(this, Statics.ssmSubjectHashDiversifier);
    const callbackFunction = new ApiFunction(this, 'yivi-issue-callback-function', {
      table: this.sessionsTable,
      tablePermissions: 'ReadWrite',
      applicationUrlBase: baseUrl,
      readOnlyRole,
      description: 'Callback-lambda voor de YIVI issue-applicatie.',
      logRetention: RetentionDays.ONE_YEAR, // Keep track of statistics for 1 year
      ssmLogGroup: Statics.ssmStatisticsLogGroup,
      environment: {
        DIVERSIFYER: diversifiyer,
      },
      lambdaInsightsExtensionArn: insightsArn,
    }, CallbackFunction);

    this.api.addRoutes({
      integration: new HttpLambdaIntegration('yivi-issue-login', loginFunction.lambda),
      path: '/login',
      methods: [apigatewayv2.HttpMethod.GET],
    });

    this.api.addRoutes({
      integration: new HttpLambdaIntegration('yivi-issue-logout', logoutFunction.lambda),
      path: '/logout',
      methods: [apigatewayv2.HttpMethod.GET],
    });

    this.api.addRoutes({
      integration: new HttpLambdaIntegration('yivi-issue-auth', authFunction.lambda),
      path: '/auth',
      methods: [apigatewayv2.HttpMethod.GET],
    });

    this.api.addRoutes({ // Also availabel at / due to CloudFront defaultRootObject
      integration: new HttpLambdaIntegration('yivi-issue-issue', issueFunction.lambda),
      path: '/issue',
      methods: [apigatewayv2.HttpMethod.GET],
    });

    this.api.addRoutes({
      integration: new HttpLambdaIntegration('yivi-issue-success', callbackFunction.lambda),
      path: '/callback',
      methods: [apigatewayv2.HttpMethod.GET],
    });
  }

  /**
   * Clean and return the apigateway subdomain placeholder
   * https://${Token[TOKEN.246]}.execute-api.eu-west-1.${Token[AWS.URLSuffix.3]}/
   * which can't be parsed by the URL class.
   *
   * @returns a domain-like string cleaned of protocol and trailing slash
   */
  domain(): string {
    const url = this.api.url;
    if (!url) { return ''; }
    let cleanedUrl = url
      .replace(/^https?:\/\//, '') //protocol
      .replace(/\/$/, ''); //optional trailing slash
    return cleanedUrl;
  }

  /**
   * Create a role with read-only access to the application
   *
   * @returns Role
   */
  readOnlyRole(): Role {
    const readOnlyRole = new Role(this, 'read-only-role', {
      roleName: 'yivi-issue-full-read',
      description: 'Read-only role for YIVI issue app with access to lambdas, logging, session store',
      assumedBy: new PrincipalWithConditions(
        new AccountPrincipal(Statics.iamAccountId), //IAM account
        {
          Bool: {
            'aws:MultiFactorAuthPresent': true,
          },
        },
      ),
    });

    new SSM.StringParameter(this, 'ssm_readonly', {
      stringValue: readOnlyRole.roleArn,
      parameterName: Statics.ssmReadOnlyRoleArn,
    });
    return readOnlyRole;
  }

  allowReadAccessToTable(role: Role, table: Table) {
    role.addManagedPolicy(
      new DynamoDbReadOnlyPolicy(this, 'read-policy', {
        tableArn: table.tableArn,
      }),
    );
  }
}