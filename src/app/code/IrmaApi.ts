import {
  SecretsManagerClient,
  GetSecretValueCommand,
} from '@aws-sdk/client-secrets-manager';
import { aws4Interceptor } from 'aws4-axios';
// import axios from 'axios';
import * as axios from 'axios';

export class IrmaApi {

  private host;
  private demo;
  private credentials: {
    accessKeyId: string;
    secretAccessKey: string;
  };
  private apiKey: string;

  constructor(host?: string, demo: boolean=false, accessKey=undefined, secretKey=undefined, apiKey=undefined) {
    this.host = host ? host : process.env.IRMA_API_HOST;
    this.demo = demo ? demo : process.env.IRMA_API_DEMO;

    this.credentials = {
      accessKeyId: accessKey ? accessKey : '',
      secretAccessKey: secretKey ? secretKey : '',
    };
    this.apiKey = apiKey ? apiKey : '';
  }

  async init() {
    if (!process.env.IRMA_API_ACCESS_KEY_ARN || !process.env.IRMA_API_SECRET_KEY_ARN || !process.env.IRMA_API_KEY_ARN) {
      throw Error('Clould not initialize IRMA API client');
    }
    this.apiKey = await this.getSecret(process.env.IRMA_API_KEY_ARN);
    this.credentials = {
      accessKeyId: await this.getSecret(process.env.IRMA_API_ACCESS_KEY_ARN),
      secretAccessKey: await this.getSecret(process.env.IRMA_API_SECRET_KEY_ARN),
    };
  }

  async getSecret(arn: string) {
    if (!arn) {
      throw new Error('No ARN provided');
    }
    const secretsManagerClient = new SecretsManagerClient({});
    const command = new GetSecretValueCommand({ SecretId: arn });
    const data = await secretsManagerClient.send(command);
    if (data?.SecretString) {
      return data.SecretString;
    }
    throw new Error('No secret value found');
  }

  async startSession(brpData: any) {

    const irmaIssueRequest: axios.AxiosRequestConfig = {
      method: 'POST',
      url: `https://${this.host}/irma/session`,
      data: this.constructIrmaIssueRequest(brpData),
      headers: {
        'irma-authorization': this.apiKey,
        'Content-type': 'application/json',
      },
    };

    return this.makeSignedRequest(irmaIssueRequest, 'De IRMA sessie kon niet worden gestart.');

  }

  async getSessionResult(token: string) {

    const sessionResultRequest: axios.AxiosRequestConfig = {
      method: 'GET',
      url: `https://${this.host}/irma/session/${token}/result`,
      headers: {
        'irma-authorization': this.apiKey,
      },
    };

    return this.makeSignedRequest(sessionResultRequest, 'Could not get session result from IRMA server');

  }

  async makeSignedRequest(request: axios.AxiosRequestConfig, errorMsg: string) {
    try {

      const interceptor = aws4Interceptor({
        region: 'eu-west-1',
        service: 'execute-api',
      }, this.credentials);
      axios.default.interceptors.request.use(interceptor);

      let resp = await axios.default.request(request);
      if (resp.data) {
        return resp.data;
      } else {
        throw Error();
      }
    } catch {
      const data = {
        error: errorMsg,
      };
      return data;
    }
  }

  constructIrmaIssueRequest(brpData: any) {
    console.log(brpData);
    return {
      type: 'issuing',
      credentials: [
        {
          credential: this.demo ? 'irma-demo.gemeente.address' : 'irma.gemeente.address',
          validity: 1678455605,
          attributes: {
            street: 'Kortestraat',
            houseNumber: '6',
            zipcode: '6511PP',
            municipality: 'Nijmegen',
            city: 'Nijmegen',
          },
        },
        {
          credential: this.demo ? 'irma-demo.gemeente.personalData' : 'irma.gemeente.personalData',
          validity: 1678455605,
          attributes: {
            initials: '',
            firstnames: 'Test',
            prefix: '',
            familyname: 'Test',
            fullname: 'Test Test',
            dateofbirth: '20-10-1996',
            gender: 'M',
            nationality: 'yes',
            surname: 'Test',
            cityofbirth: 'Nijmegen',
            countryofbirth: 'Nederland',
            over12: 'yes',
            over16: 'yes',
            over18: 'yes',
            over21: 'yes',
            over65: 'no',
            bsn: '1234',
            digidlevel: '12',
          },
        },
      ],
    };
  }

}
