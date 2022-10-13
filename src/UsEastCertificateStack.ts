import { aws_certificatemanager as CertificateManager, Stack, StackProps, aws_ssm as SSM } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { Statics } from './statics';

export interface UsEastCertificateStackProps extends StackProps {
  branch: string;
}

export class UsEastCertificateStack extends Stack {
  private branch: string;

  constructor(scope: Construct, id: string, props: UsEastCertificateStackProps) {
    super(scope, id, props);
    this.branch = props.branch;
    this.createCertificate(props.branch);
  }

  createCertificate(branch: string) {
    //const subdomain = Statics.subDomain(this.branch);
    const cspSubdomain = Statics.cspSubDomain(this.branch);
    //const appDomain = `${subdomain}.nijmegen.nl`;
    const cspDomain = `${cspSubdomain}.csp-nijmegen.nl`;

    let subjectAlternativeNames = undefined;
    if (branch != 'development') {
      //subjectAlternativeNames = [appDomain]; // TODO deploy when CNAME op nijmegen.nl is set
    }

    const certificate = new CertificateManager.Certificate(this, 'certificate', {
      domainName: cspDomain,
      subjectAlternativeNames,
      validation: CertificateManager.CertificateValidation.fromDns(),
    });

    new SSM.StringParameter(this, 'cert-arn', {
      stringValue: certificate.certificateArn,
      parameterName: Statics.certificateArn,
    });

  }
}