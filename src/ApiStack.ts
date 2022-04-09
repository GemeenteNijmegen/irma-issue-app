import * as Path from 'path';
import * as cdk from 'aws-cdk-lib';
import { aws_apigateway as apiGateway, aws_secretsmanager as SecretsManager, aws_ssm as SSM, aws_dynamodb as DynamoDb } from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { Runtime } from 'aws-cdk-lib/aws-lambda';
import { Construct } from 'constructs';
import { ApiFunction } from './ApiFunction';
import { Statics } from './Statics';


export interface ApiStackProps extends cdk.StackProps {
  enableManualAuthentication: boolean;
  enableIrmaAuthentication: boolean;
}

export class ApiStack extends cdk.Stack {
  staticResourcesUrl : string;
  api: apiGateway.RestApi;

  constructor(scope: Construct, id: string, props: ApiStackProps) {
    super(scope, id, props);

    // Import assets url
    this.staticResourcesUrl = SSM.StringParameter.fromStringParameterName(this, 'statics-url', Statics.ssmStaticResourcesUrl).stringValue;

    // Import session table by arn
    const sessionTableArn = SSM.StringParameter.fromStringParameterName(this, 'session-table-arn', Statics.ssmSessionsTableArn).stringValue;
    const sessionTable = DynamoDb.Table.fromTableArn(this, 'session-table', sessionTableArn);

    // Create the API gateway itself
    this.api = new apiGateway.RestApi(this, 'gateway', {
      // deployOptions: {
      //   stageName: Statics.apiGatewayStageName,
      // },
      description: 'irma-issue-app-api-gateway',
    });

    // Explicit stack outputs
    new cdk.CfnOutput(this, 'cfn-output-full-url', {
      value: this.api.url,
      exportName: 'full-api-gateway-url',
    });
    new cdk.CfnOutput(this, 'cfn-output-cleaned-url', {
      value: this.getApiGatewayDomain(),
      exportName: 'cleaned-api-gateway-url',
    });

    // Construct the home lambda
    const homeLambda = new ApiFunction(this, 'home-lambda', {
      handler: 'index.handler',
      description: 'Home lambda for IRMA issue app',
      source: Path.join(__dirname, 'app', 'home'),
      table: sessionTable,
      tablePermissions: 'ReadWrite',
      environment: {
        ASSETS_URL: this.staticResourcesUrl,
        IRMA_AUTH_ENABLED: props.enableIrmaAuthentication.toString(),
        SESSION_TABLE: sessionTable.tableName,
      },
    });

    // Construct the issue lambda
    // TODO: Move accessKey to secret manager.
    const secretKey = SecretsManager.Secret.fromSecretNameV2(this, 'secret-key-irma', Statics.irmaIssueServerSecretKey);
    const accessKey = SecretsManager.Secret.fromSecretNameV2(this, 'access-key-irma', Statics.irmaIssueServerAccessKey);
    const irmaEndpoint = SSM.StringParameter.fromStringParameterName(this, 'endpoint-irma', Statics.iramIssueServerEndpoint);
    const irmaRegion = SSM.StringParameter.fromStringParameterName(this, 'region-irma', Statics.irmaIssueServerZone);
    const irmaNamespace = SSM.StringParameter.fromStringParameterName(this, 'irma-namespace', Statics.irmaNamespace);
    const irmaApiKey = SecretsManager.Secret.fromSecretNameV2(this, 'irma-api-key', Statics.irmaApiKey);
    const brpIrmaEndpoint = SSM.StringParameter.fromStringParameterName(this, 'brp-irma-endpoint', Statics.brpEndpoint);
    const brpCertificate = SSM.StringParameter.fromStringParameterName(this, 'brp-cert', Statics.brpCertificate);
    const brpCertificateKey = SecretsManager.Secret.fromSecretNameV2(this, 'brp-cert-key', Statics.brpCertificateKey);
    const issueLambda = new ApiFunction(this, 'issue-lambda', {
      handler: 'index.handler',
      description: 'Issue lambda for IRMA issue app',
      source: Path.join(__dirname, 'app', 'issue'),
      table: sessionTable,
      tablePermissions: 'ReadWrite',
      environment: {
        ASSETS_URL: this.staticResourcesUrl,
        SESSION_TABLE: sessionTable.tableName,
        IRMA_ISSUE_SERVER_ENDPOINT: irmaEndpoint.stringValue,
        IRMA_ISSUE_SERVER_IAM_ACCESS_KEY: accessKey.secretArn,
        IRMA_ISSUE_SERVER_IAM_REGION: irmaRegion.stringValue,
        IRMA_NAMESPACE: irmaNamespace.stringValue,
        IRMA_ISSUE_SERVER_IAM_SECRET_KEY_ARN: secretKey.secretArn,
        IRMA_API_KEY_ARN: irmaApiKey.secretArn,
        BRP_CERTIFICATE_PARAM_NAME: Statics.brpCertificate,
        BRP_CERTIFICATE_KEY_ARN: brpCertificateKey.secretArn,
        BRP_IRMA_ENDPOINT: brpIrmaEndpoint.stringValue,
      },
    });
    secretKey.grantRead(issueLambda.lambda);
    accessKey.grantRead(issueLambda.lambda);
    irmaApiKey.grantRead(issueLambda.lambda);
    brpCertificateKey.grantRead(issueLambda.lambda);
    brpCertificate.grantRead(issueLambda.lambda);

    // Construct the auth lambda
    const authLambda = new ApiFunction(this, 'auth-lambda', {
      handler: 'index.handler',
      description: 'Authentication landing lambda for IRMA issue app',
      source: Path.join(__dirname, 'app', 'auth'),
      table: sessionTable,
      tablePermissions: 'ReadWrite',
      environment: {
        ASSETS_URL: this.staticResourcesUrl,
        SESSION_TABLE: sessionTable.tableName,
      },
    });

    // Add each of the lambdas to the api gateway as resources
    this.api.root.addMethod('GET', new apiGateway.LambdaIntegration(homeLambda.lambda));

    const issue = this.api.root.addResource('issue');
    issue.addMethod('GET', new apiGateway.LambdaIntegration(issueLambda.lambda));

    const auth = this.api.root.addResource('auth');
    auth.addMethod('GET', new apiGateway.LambdaIntegration(authLambda.lambda));

    // Enable the manual authentication (protected with basic auth) if required
    if (props.enableManualAuthentication) {
      this.enableManualAuthenticationLambda(this.api, sessionTable);
    }

    // Enable the iram authentication lambdas when required
    if (props.enableIrmaAuthentication) {
      this.enableIrmaAuthentication(this.api);
    }

  }

  /**
   * Registers the basic auth authorizer, and manual authentication lambda
   * in the api gateway. Also modifies the default http 401 unauthorized
   * response to contain a WWW-Authenticate:Basic header for a prompt in the
   * browser.
   * @param api
   */
  enableManualAuthenticationLambda(api: apiGateway.RestApi, sessionTable: DynamoDb.ITable) {

    // First secure this endpoint with basic authentication
    const authorizerLambda = new lambda.Function(this, 'authorizer-lambda', {
      runtime: Runtime.NODEJS_14_X,
      handler: 'index.handler',
      description: 'Manual authentication lambda for IRMA issue app',
      code: lambda.Code.fromAsset(Path.join(__dirname, 'app', 'authorizer')),
    });

    // Create the authorizer for the basic auth authorization
    const authorizer = new apiGateway.RequestAuthorizer(this, 'manual-auth-authorizer', {
      handler: authorizerLambda,
      identitySources: [apiGateway.IdentitySource.header('Authorization')],
    });

    // Construct a authentication bypass lambda
    const manualAuthLambda = new ApiFunction(this, 'manual-auth-lambda', {
      handler: 'index.handler',
      description: 'Manual authentication lambda for IRMA issue app',
      source: Path.join(__dirname, 'app', 'manual_auth'),
      table: sessionTable,
      tablePermissions: 'ReadWrite',
      environment: {
        ASSETS_URL: this.staticResourcesUrl,
        SESSION_TABLE: sessionTable.tableName,
      },
    });

    // Create endpoint in the api for this lambda and secure it
    const home = api.root.addResource('manual_auth');
    home.addMethod('GET', new apiGateway.LambdaIntegration(manualAuthLambda.lambda), {
      authorizer: authorizer,
    });

    // Modify the default api gateway unauhtorized response
    api.addGatewayResponse('basic-auth-unauthorized', {
      type: apiGateway.ResponseType.UNAUTHORIZED,
      statusCode: '401',
      responseHeaders: {
        'test-key': "'test-value'", // double qotes requried https://github.com/aws/aws-cdk/issues/11306
        'WWW-Authenticate': "'Basic'",
      },
      templates: {
        'application/json': '{ "message": $context.error.messageString, "statusCode": "401", "type": "$context.error.responseType" }',
      },
    });

  }

  enableIrmaAuthentication(api: apiGateway.RestApi) {

    //TODO: Find out how irma authentication works..
    console.log(api.domainName);

  }

  /**
     * Clean and return the apigateway subdomain placeholder
     * https://${Token[TOKEN.246]}.execute-api.eu-west-1.${Token[AWS.URLSuffix.3]}/
     * which can't be parsed by the URL class.
     *
     * @returns a domain-like string cleaned of protocol and trailing slash
     */
  getApiGatewayDomain(): string {
    if (!this.api.url) { return ''; }
    let cleanedUrl = this.api.url
      .replace(/^https?:\/\//, '') //protocol
      .replace(/\/$/, ''); // trailing /
    return cleanedUrl;
  }


}