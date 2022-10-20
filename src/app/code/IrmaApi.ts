import {
  SecretsManagerClient,
  GetSecretValueCommand,
} from '@aws-sdk/client-secrets-manager';
import { aws4Interceptor } from 'aws4-axios';
import axios, { Axios, AxiosRequestConfig } from 'axios';

export class IrmaApi {

  private host;
  private demo;
  private credentials: {
    accessKeyId: string;
    secretAccessKey: string;
  };
  private apiKey: string;

  constructor() {
    this.host = process.env.IRMA_API_HOST ? process.env.IRMA_API_HOST : '';
    this.demo = process.env.IRMA_API_DEMO == 'demo' ? true : false;
    this.credentials = {
      accessKeyId: '',
      secretAccessKey: '',
    };
    this.apiKey = '';
  }

  getHost() {
    return this.host;
  }

  async init() {
    if (!process.env.IRMA_API_ACCESS_KEY_ID_ARN || !process.env.IRMA_API_SECRET_KEY_ARN || !process.env.IRMA_API_KEY_ARN) {
      throw Error('Clould not initialize IRMA API client');
    }
    this.apiKey = await this.getSecret(process.env.IRMA_API_KEY_ARN);
    this.credentials = {
      accessKeyId: await this.getSecret(process.env.IRMA_API_ACCESS_KEY_ID_ARN),
      secretAccessKey: await this.getSecret(process.env.IRMA_API_SECRET_KEY_ARN),
    };
  }

  manualInit(host: string, demo: boolean, accesKey: string, secretKey: string, apiKey: string) {
    this.host = host;
    this.demo = demo;
    this.apiKey = apiKey;
    this.credentials = {
      accessKeyId: accesKey,
      secretAccessKey: secretKey,
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

    const irmaIssueRequest: AxiosRequestConfig = {
      method: 'POST',
      url: `https://${this.host}/session`,
      data: this.constructIrmaIssueRequest(brpData),
      headers: {
        'irma-authorization': this.apiKey,
        'Content-type': 'application/json',
      },
    };

    return this.makeSignedRequest(irmaIssueRequest, 'De IRMA sessie kon niet worden gestart.');

  }

  private getSigningClient(): Axios {
    const interceptor = aws4Interceptor({
      region: 'eu-west-1',
      service: 'execute-api',
    }, this.credentials);
    const client = new Axios();
    client.interceptors.request.use(interceptor);
    return client;
  }

  private async makeSignedRequest(request: AxiosRequestConfig, errorMsg: string) {
    console.debug('Starting signed request:', request);

    try {
      const client = this.getSigningClient();
      let resp = await client.request(request);

      if (resp.data) {
        console.debug('Response data:', resp.data);
        return resp.data;
      }
      throw Error(errorMsg);
    } catch (error: any) {
      if (axios.isAxiosError(error)) {
        if (error.response) {
          // The request was made and the server responded with a status code
          // that falls out of the range of 2xx
          console.log(`http status for ${request.url}: ${error.response?.status}`);
        } else if (error.request) {
          // The request was made but no response was received
          // `error.request` is an instance of XMLHttpRequest in the browser and an instance of
          // http.ClientRequest in node.js
          console.error(error === null || error === void 0 ? void 0 : error.code);
        } else {
          // Something happened in setting up the request that triggered an Error
          console.error(error.message);
        }
      } else {
        console.error(error.message);
      }
      return { error: errorMsg };
    }
  }

  constructIrmaIssueRequest(brpData: any) {

    // Get persoonsgegevens
    const gegevens = brpData.Persoon.Persoonsgegevens;

    const currentYear = new Date().getFullYear();
    const date5ytd = Math.floor(new Date().setFullYear(currentYear + 5) / 1000);
    const date1ytd = Math.floor(new Date().setFullYear(currentYear + 1) / 1000);
    console.info('YTD', date1ytd, '5 YTD', date5ytd);

    // Return the issue request
    return {
      type: 'issuing',
      credentials: [
        {
          credential: this.demo ? 'irma-demo.gemeente.address' : 'irma.gemeente.address',
          validity: date1ytd,
          attributes: {
            street: brpData.Persoon.Adres.Straat,
            houseNumber: brpData.Persoon.Adres.Huisnummer,
            zipcode: brpData.Persoon.Adres.Postcode,
            municipality: brpData.Persoon.Adres.Gemeente,
            city: brpData.Persoon.Adres.Woonplaats,
          },
        },
        {
          credential: this.demo ? 'irma-demo.gemeente.personalData' : 'irma.gemeente.personalData',
          validity: date5ytd,
          attributes: {
            initials: gegevens.Voorletters,
            firstnames: gegevens.Voornamen,
            prefix: gegevens.Voorvoegsel,
            familyname: gegevens.Achternaam,
            fullname: gegevens.Naam,
            dateofbirth: gegevens.Geboortedatum,
            gender: gegevens.Geslacht,
            nationality: gegevens.NederlandseNationaliteit == 'Ja' ? 'yes' : 'no',
            surname: gegevens.Achternaam,
            cityofbirth: gegevens.Geboorteplaats,
            countryofbirth: gegevens.Geboorteland,
            bsn: brpData.Persoon.BSN.BSN,
            digidlevel: '12', // TODO check what this should be?
            ...brpData.Persoon.ageLimits, // Set agelimits directly
          },
        },
      ],
    };
  }

}
