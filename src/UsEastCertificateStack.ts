import { aws_certificatemanager as CertificateManager, Stack, StackProps, aws_ssm as SSM } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { Configurable, Configuration } from './Configuration';
import { Statics } from './statics';
import { AppDomainUtil, importProjectHostedZone } from './Util';

export interface UsEastCertificateStackProps extends StackProps, Configurable {}

export class UsEastCertificateStack extends Stack {

  constructor(scope: Construct, id: string, props: UsEastCertificateStackProps) {
    super(scope, id, props);
    this.createCertificate(props.configuration);
  }

  createCertificate(configuration: Configuration) {

    const hostedZone = importProjectHostedZone(this, configuration.deployToEnvironment.region);
    const subjectAlternativeNames = AppDomainUtil.getAlternativeDomainNames(configuration);

    const certificate = new CertificateManager.Certificate(this, 'certificate', {
      domainName: hostedZone.zoneName,
      subjectAlternativeNames,
      validation: CertificateManager.CertificateValidation.fromDns(hostedZone),
    });

    new SSM.StringParameter(this, 'cert-arn', {
      stringValue: certificate.certificateArn,
      parameterName: Statics.certificateArn,
    });

  }
}