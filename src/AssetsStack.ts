import * as Path from 'path';
import * as cdk from 'aws-cdk-lib';
import { aws_s3 as s3, aws_cloudfront_origins as origins, aws_s3_deployment as s3deploy, aws_cloudfront as cloudFront, aws_ssm as SSM } from 'aws-cdk-lib';
import { PriceClass } from 'aws-cdk-lib/aws-cloudfront';
import { Construct } from 'constructs';
import { Statics } from './Statics';


export class AssetsStack extends cdk.Stack {

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const assets = new s3.Bucket(this, 'assets-bucket', {
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    new s3deploy.BucketDeployment(this, 'assets-deployment-to-bucket', {
      sources: [s3deploy.Source.asset(Path.join(__dirname, 'assets'))],
      destinationBucket: assets,
    });

    const dist = new cloudFront.Distribution(this, 'assets-distribution', {
      comment: 'Servers assets for the irma-issue-app',
      defaultBehavior: {
        origin: new origins.S3Origin(assets),
      },
      priceClass: PriceClass.PRICE_CLASS_100,

    });

    // Set the distribution name to use in other stacks
    new SSM.StringParameter(this, 'static-resources-url', {
      stringValue: `https://${dist.distributionDomainName}`,
      parameterName: Statics.ssmStaticResourcesUrl,
    });


  }
}