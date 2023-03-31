import {
  aws_certificatemanager as CertificateManager, aws_ssm as SSM, Stack,
  StackProps,
} from 'aws-cdk-lib';
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

    /**
     * When using alternative domain names we cannot use auto-creation of the validation
     * records in the hosted zone.
     */
    let validation = CertificateManager.CertificateValidation.fromDns(hostedZone);
    if (subjectAlternativeNames) {
      validation = CertificateManager.CertificateValidation.fromDns();
    }

    const certificate = new CertificateManager.Certificate(this, 'certificate', {
      domainName: hostedZone.zoneName,
      subjectAlternativeNames,
      validation: validation,
    });

    new SSM.StringParameter(this, 'cert-arn', {
      stringValue: certificate.certificateArn,
      parameterName: Statics.certificateArn,
    });

  }

}