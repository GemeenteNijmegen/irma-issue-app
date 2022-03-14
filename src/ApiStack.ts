import * as Path from 'path';
import * as cdk from 'aws-cdk-lib';
import { aws_apigateway as apiGateway, aws_secretsmanager as SecretsManager, aws_ssm as SSM } from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { Runtime } from 'aws-cdk-lib/aws-lambda';
import { Construct } from 'constructs';
import { ApiFunction } from './ApiFunction';
import { SessionsTable } from './SessionsTable';
import { Statics } from './Statics';


export interface ApiStackProps extends cdk.StackProps {
  assetsUrl: string;
  enableManualAuthentication: boolean;
  enableIrmaAuthentication: boolean;
  sessionsTable: SessionsTable;
}

export class ApiStack extends cdk.Stack {

  constructor(scope: Construct, id: string, props: ApiStackProps) {
    super(scope, id, props);

    // Create the API gateway itself
    const api = new apiGateway.RestApi(this, 'gateway', {
      deployOptions: {
        stageName: 'irma-issue',
      },
    });

    // Construct the home lambda
    const homeLambda = new ApiFunction(this, 'home-lambda', {
      handler: 'index.handler',
      description: 'Home lambda for IRMA issue app',
      source: Path.join(__dirname, 'app', 'home'),
      table: props.sessionsTable.table,
      tablePermissions: 'ReadWrite',
      environment: {
        ASSETS_URL: props.assetsUrl,
        IRMA_AUTH_ENABLED: props.enableIrmaAuthentication.toString(),
        SESSION_TABLE: props.sessionsTable.table.tableName,
      },
    });

    // Construct the issue lambda
    const secretKey = SecretsManager.Secret.fromSecretNameV2(this, 'secret-key-irma', Statics.irmaIssueServerSecretKey);
    const accessKey = SSM.StringParameter.fromStringParameterName(this, 'access-key-irma', Statics.irmaIssueServerAccessKey);
    const irmaEndpoint = SSM.StringParameter.fromStringParameterName(this, 'endpoint-irma', Statics.iramIssueServerEndpoint);
    const irmaRegion = SSM.StringParameter.fromStringParameterName(this, 'region-irma', Statics.irmaIssueServerZone);
    const irmaNamespace = SSM.StringParameter.fromStringParameterName(this, 'irma-namespace', Statics.irmaNamespace);
    const irmaApiKey = SecretsManager.Secret.fromSecretNameV2(this, 'irma-api-key', Statics.irmaApiKey);
    const issueLambda = new ApiFunction(this, 'issue-lambda', {
      handler: 'index.handler',
      description: 'Issue lambda for IRMA issue app',
      source: Path.join(__dirname, 'app', 'issue'),
      table: props.sessionsTable.table,
      tablePermissions: 'ReadWrite',
      environment: {
        ASSETS_URL: props.assetsUrl,
        SESSION_TABLE: props.sessionsTable.table.tableName,
        IRMA_ISSUE_SERVER_ENDPOINT: irmaEndpoint.stringValue,
        IRMA_ISSUE_SERVER_IAM_ACCESS_KEY: accessKey.stringValue,
        IRMA_ISSUE_SERVER_IAM_REGION: irmaRegion.stringValue,
        IRMA_NAMESPACE: irmaNamespace.stringValue,
        IRMA_ISSUE_SERVER_IAM_SECRET_KEY_ARN: secretKey.secretArn,
      },
    });
    secretKey.grantRead(issueLambda.lambda);
    irmaApiKey.grantRead(issueLambda.lambda);

    // Construct the auth lambda
    const authLambda = new ApiFunction(this, 'auth-lambda', {
      handler: 'index.handler',
      description: 'Authentication landing lambda for IRMA issue app',
      source: Path.join(__dirname, 'app', 'auth'),
      table: props.sessionsTable.table,
      tablePermissions: 'ReadWrite',
      environment: {
        ASSETS_URL: props.assetsUrl,
        SESSION_TABLE: props.sessionsTable.table.tableName,
      },
    });

    // Add each of the lambdas to the api gateway as resources
    api.root.addMethod('GET', new apiGateway.LambdaIntegration(homeLambda.lambda));

    const issue = api.root.addResource('issue');
    issue.addMethod('GET', new apiGateway.LambdaIntegration(issueLambda.lambda));

    const auth = api.root.addResource('auth');
    auth.addMethod('GET', new apiGateway.LambdaIntegration(authLambda.lambda));

    // Enable the manual authentication (protected with basic auth) if required
    if (props.enableManualAuthentication) {
      this.enableManualAuthenticationLambda(api, props);
    }

    // Enable the iram authentication lambdas when required
    if (props.enableIrmaAuthentication) {
      this.enableIrmaAuthentication(api);
    }

  }

  /**
   * Registers the basic auth authorizer, and manual authentication lambda
   * in the api gateway. Also modifies the default http 401 unauthorized
   * response to contain a WWW-Authenticate:Basic header for a prompt in the
   * browser.
   * @param api
   */
  enableManualAuthenticationLambda(api: apiGateway.RestApi, props: ApiStackProps) {

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
      table: props.sessionsTable.table,
      tablePermissions: 'ReadWrite',
      environment: {
        ASSETS_URL: props.assetsUrl,
        SESSION_TABLE: props.sessionsTable.table.tableName,
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

}