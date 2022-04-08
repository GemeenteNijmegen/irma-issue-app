import {
  Stack,
  StackProps,
  Duration,
  aws_route53 as Route53,
  aws_route53_targets as Route53Targets,
  aws_ssm as SSM,
} from 'aws-cdk-lib';
import {
  Distribution,
  PriceClass,
  AllowedMethods,
  ResponseHeadersPolicy,
  HeadersFrameOption,
  HeadersReferrerPolicy,
  SecurityPolicyProtocol,
  OriginRequestPolicy,
  OriginRequestHeaderBehavior,
  ViewerProtocolPolicy,
  CachePolicy,
  CacheCookieBehavior,
  CacheQueryStringBehavior,
  CacheHeaderBehavior,
} from 'aws-cdk-lib/aws-cloudfront';
import { HttpOrigin } from 'aws-cdk-lib/aws-cloudfront-origins';
import { Construct } from 'constructs';
import { Statics } from './Statics';

export interface CloudFrontStackProps extends StackProps {
  /**
       * current branch: Determines subdomain of csp-nijmegen.nl
       */
  branch: string;
}

export class CloudFrontStack extends Stack {
  constructor(scope: Construct, id: string, props: CloudFrontStackProps) {
    super(scope, id, props);

    const apiGatewayUrlStr = SSM.StringParameter.fromStringParameterName(this, 'api-gateway-url', Statics.ssmApiGatewayUrl).stringValue;
    //const apiGatewayUrl = new URL(apiGatewayUrlStr);

    //const subdomain = Statics.subDomain(props.branch);
    //const cspDomain = `${subdomain}.csp-nijmegen.nl`;
    //const domains = [cspDomain];

    const cloudfrontDistribution = this.setCloudfrontStack(apiGatewayUrlStr);
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
  setCloudfrontStack(apiGatewayDomain: string): Distribution { //, certificateArn?: string
    // TODO: Add certificate to couldfront distribution
    //   const certificate = (certificateArn) ? CertificateManager.Certificate.fromCertificateArn(this, 'certificate', certificateArn) : undefined;
    const distribution = new Distribution(this, 'cf-distribution', {
      priceClass: PriceClass.PRICE_CLASS_100,
      //domainNames,
      // certificate,
      defaultBehavior: {
        origin: new HttpOrigin(apiGatewayDomain),
        originRequestPolicy: new OriginRequestPolicy(this, 'cf-originrequestpolicy', {
          originRequestPolicyName: 'cfOriginRequestPolicyIrmaIssue',
          headerBehavior: OriginRequestHeaderBehavior.allowList( // TODO: These headers are forwarded to the api gateway, check which headers are needed
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
          cachePolicyName: 'cfCachingSessionsIrmaIssue',
          cookieBehavior: CacheCookieBehavior.all(),
          headerBehavior: CacheHeaderBehavior.allowList('Authorization'),
          queryStringBehavior: CacheQueryStringBehavior.all(),
          defaultTtl: Duration.seconds(0),
          minTtl: Duration.seconds(0),
          maxTtl: Duration.seconds(1),
        }),
        //responseHeadersPolicy: this.responseHeadersPolicy(),
      },
      // logBucket: this.logBucket(), // TODO: Add bucket to collect the logs
      minimumProtocolVersion: SecurityPolicyProtocol.TLS_V1_2_2019,
    });
    return distribution;
  }

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
     * bucket voor cloudfront logs
     */
  // logBucket() {
  //   const cfLogBucket = new Bucket(this, 'CloudfrontLogs', {
  //     blockPublicAccess: BlockPublicAccess.BLOCK_ALL,
  //     encryption: BucketEncryption.S3_MANAGED,
  //     lifecycleRules: [
  //       {
  //         id: 'delete objects after 180 days',
  //         enabled: true,
  //         expiration: Duration.days(180),
  //       },
  //     ],
  //   });
  //   return cfLogBucket;
  // }


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
        strictTransportSecurity: { accessControlMaxAge: Duration.seconds(600), includeSubdomains: true, override: true },
      },
    });
    return responseHeadersPolicy;
  }

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

}
