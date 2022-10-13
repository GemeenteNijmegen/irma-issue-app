import { aws_certificatemanager as CertificateManager, Stack, StackProps, aws_ssm as SSM } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { Statics } from './statics';

export interface UsEastCertificateStackProps extends StackProps {
  branch: string;
  addNijmegenDomain: boolean;
}

export class UsEastCertificateStack extends Stack {
  private branch: string;
  private addNijmegenDomain: boolean;

  constructor(scope: Construct, id: string, props: UsEastCertificateStackProps) {
    super(scope, id, props);
    this.branch = props.branch;
    this.addNijmegenDomain = props.addNijmegenDomain;
    this.createCertificate();
  }

  createCertificate() {
    const cspSubdomain = Statics.cspSubDomain(this.branch);
    const cspDomain = `${cspSubdomain}.csp-nijmegen.nl`;

    let subjectAlternativeNames = undefined;
    if (this.addNijmegenDomain) {
      const subdomain = Statics.subDomain(this.branch);
      const appDomain = `${subdomain}.nijmegen.nl`;
      subjectAlternativeNames = [appDomain];
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