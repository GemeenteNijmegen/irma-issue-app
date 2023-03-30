import * as crypto from 'crypto';
import {
  aws_certificatemanager as CertificateManager,
  Stack,
  StackProps,
  aws_ssm as SSM,
  aws_route53 as route53,
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

    if (configuration.cnameRecords) {
      this.addCnameRecords(hostedZone, configuration.cnameRecords);
    }

  }

  /**
   * Add the CNAME records to the hosted zone that are
   * provided in the branch specific configuration
   * @param hostedZone the hosted zone to add the records to
   * @param cnameRecords configruation property containing the records
   */
  addCnameRecords(hostedZone: route53.IHostedZone, cnameRecords: { [key: string]: string }) {
    Object.entries(cnameRecords).forEach(entry => {
      const logicalId = crypto.createHash('md5').update(entry[0]).digest('hex').substring(0, 10);
      new route53.CnameRecord(this, `record-${logicalId}`, {
        zone: hostedZone,
        recordName: entry[0],
        domainName: entry[1],
      });
    });
  }
}