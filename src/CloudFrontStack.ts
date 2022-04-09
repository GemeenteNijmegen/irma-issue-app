import {
  Stack,
  StackProps,
  Duration,
  aws_route53 as Route53,
  aws_route53_targets as Route53Targets,
  aws_ssm as SSM,
  aws_iam as IAM,
} from 'aws-cdk-lib';
import {
  Distribution,
  PriceClass,
  OriginRequestPolicy,
  ViewerProtocolPolicy,
  AllowedMethods,
  ResponseHeadersPolicy,
  HeadersFrameOption,
  HeadersReferrerPolicy,
  CachePolicy,
  OriginRequestHeaderBehavior,
  CacheCookieBehavior,
  CacheHeaderBehavior,
  CacheQueryStringBehavior,
  SecurityPolicyProtocol,
  OriginAccessIdentity,
} from 'aws-cdk-lib/aws-cloudfront';
import { HttpOrigin } from 'aws-cdk-lib/aws-cloudfront-origins';
import { Bucket } from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';
import { Statics } from './Statics';

export interface CloudFrontStackProps extends StackProps {
  /**
     * Domain for the default origin (HTTPorigin)
     */
  hostDomain: string;
  /**
     * current branch: Determines subdomain of csp-nijmegen.nl
     */
  branch: string;
}

export class CloudFrontStack extends Stack {
  constructor(scope: Construct, id: string, props: CloudFrontStackProps) {
    super(scope, id);

    // const subdomain = Statics.subDomain(props.branch);
    // const cspDomain = `${subdomain}.csp-nijmegen.nl`;
    // const mainDomain = `${subdomain}.nijmegen.nl`;
    // const domains = [cspDomain, mainDomain];

    // const certificateArn = this.certificateArn();

    const cloudfrontDistribution = this.setCloudfrontStack(props.hostDomain);
    this.addDnsRecords(cloudfrontDistribution);
  }

  /**
   * Create a cloudfront distribution for the application
   *
   * Do not forward the Host header to API Gateway. This results in
   * an HTTP 403 because API Gateway won't be able to find an endpoint
   * on the cloudfront domain.
   *
   * @param {string} apiGatewayDomain the domain the api gateway can be reached at
   * @returns {Distribution} the cloudfront distribution
   */
  setCloudfrontStack(apiGatewayDomain: string): Distribution {

    const distribution = new Distribution(this, 'cf-distribution', {
      priceClass: PriceClass.PRICE_CLASS_100,
      defaultBehavior: {
        origin: new HttpOrigin(apiGatewayDomain),
        originRequestPolicy: new OriginRequestPolicy(this, 'cf-originrequestpolicy', {
          originRequestPolicyName: 'cfOriginRequestPolicyIrmaIssueApp',
          headerBehavior: OriginRequestHeaderBehavior.allowList(
            'Accept-Charset',
            'Origin',
            'Accept',
            'Referer',
            'Accept-Language',
            'Accept-Datetime',
            'Authoriz',
          ),
        }),
        viewerProtocolPolicy: ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        allowedMethods: AllowedMethods.ALLOW_ALL,
        cachePolicy: new CachePolicy(this, 'cf-caching', {
          cachePolicyName: 'cfCachingSessionsIrmaIssueApp',
          cookieBehavior: CacheCookieBehavior.all(),
          headerBehavior: CacheHeaderBehavior.allowList('Authorization'),
          queryStringBehavior: CacheQueryStringBehavior.all(),
          defaultTtl: Duration.seconds(0),
          minTtl: Duration.seconds(0),
          maxTtl: Duration.seconds(1),
        }),
        responseHeadersPolicy: this.responseHeadersPolicy(),
      },
      //logBucket: this.logBucket(),
      minimumProtocolVersion: SecurityPolicyProtocol.TLS_V1_2_2019,
    });
    return distribution;
  }

  /**
   * Add DNS records for cloudfront to the Route53 Zone
   *
   * Requests to the custom domain will correctly use cloudfront.
   *
   * @param distribution the cloudfront distribution
   */
  addDnsRecords(distribution: Distribution) {
    const zoneId = SSM.StringParameter.valueForStringParameter(this, Statics.hostedZoneId);
    const zoneName = SSM.StringParameter.valueForStringParameter(this, Statics.hostedZoneName);
    const zone = Route53.HostedZone.fromHostedZoneAttributes(this, 'zone', {
      hostedZoneId: zoneId,
      zoneName: zoneName,
    });

    new Route53.ARecord(this, 'a-record', {
      zone: zone,
      target: Route53.RecordTarget.fromAlias(new Route53Targets.CloudFrontTarget(distribution)),
    });

    new Route53.AaaaRecord(this, 'aaaa-record', {
      zone: zone,
      target: Route53.RecordTarget.fromAlias(new Route53Targets.CloudFrontTarget(distribution)),
    });
  }


  /**
   * Get a set of (security) response headers to inject into the response
   * @returns {ResponseHeadersPolicy} cloudfront responseHeadersPolicy
   */
  responseHeadersPolicy(): ResponseHeadersPolicy {

    const responseHeadersPolicy = new ResponseHeadersPolicy(this, 'headers', {
      securityHeadersBehavior: {
        contentSecurityPolicy: { contentSecurityPolicy: this.cspHeaderValue(), override: true },
        contentTypeOptions: { override: true },
        frameOptions: { frameOption: HeadersFrameOption.DENY, override: true },
        referrerPolicy: { referrerPolicy: HeadersReferrerPolicy.NO_REFERRER, override: true },
        strictTransportSecurity: { accessControlMaxAge: Duration.days(366), includeSubdomains: true, override: true },
      },
    });
    return responseHeadersPolicy;
  }

  /**
   * Get the cleaned, trimmed header values for the csp header
   *
   * @returns string csp header values
   */
  cspHeaderValue() {
    const cspValues = 'default-src \'self\';\
    frame-ancestors \'self\';\
    frame-src \'self\';\
    connect-src \'self\' https://componenten.nijmegen.nl;\
    style-src \'self\' https://componenten.nijmegen.nl https://fonts.googleapis.com https://fonts.gstatic.com \
    \'sha256-hS1LM/30PjUBJK3kBX9Vm9eOAhQNCiNhf/SCDnUqu14=\' \'sha256-47DEQpj8HBSa+/TImW+5JCeuQeRkm5NMpJWZG3hSuFU=\' \'sha256-OTeu7NEHDo6qutIWo0F2TmYrDhsKWCzrUgGoxxHGJ8o=\';\
    script-src \'self\' https://componenten.nijmegen.nl https://siteimproveanalytics.com;\
    font-src \'self\' https://componenten.nijmegen.nl https://fonts.gstatic.com;\
    img-src \'self\' https://componenten.nijmegen.nl data: https://*.siteimproveanalytics.io;\
    object-src \'self\';\
    ';
    return cspValues.replace(/[ ]+/g, ' ').trim();
  }


  /**
   * Allow listBucket to the origin access identity
   *
   * Necessary so cloudfront receives 404's as 404 instead of 403. This also allows
   * a listing of the bucket if no /index.html is present in the bucket.
   *
   * @param originAccessIdentity
   * @param bucket
   */
  allowOriginAccessIdentityAccessToBucket(originAccessIdentity: OriginAccessIdentity, bucket: Bucket) {
    bucket.addToResourcePolicy(new IAM.PolicyStatement({
      resources: [
        `${bucket.bucketArn}`,
        `${bucket.bucketArn}/*`,
      ],
      actions: [
        's3:GetObject',
        's3:ListBucket',
      ],
      effect: IAM.Effect.ALLOW,
      principals: [originAccessIdentity.grantPrincipal],
    }),
    );
  }


}