import {
  SecretsManagerClient,
  GetSecretValueCommand,
} from '@aws-sdk/client-secrets-manager';
import { aws4Interceptor } from 'aws4-axios';
import * as axios from 'axios';
// import { parse, differenceInYears } from 'date-fns';

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

    const irmaIssueRequest: axios.AxiosRequestConfig = {
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

  async getSessionResult(token: string) {

    const sessionResultRequest: axios.AxiosRequestConfig = {
      method: 'GET',
      url: `https://${this.host}/session/${token}/result`,
      headers: {
        'irma-authorization': this.apiKey,
      },
    };

    return this.makeSignedRequest(sessionResultRequest, 'Kon de sessie resultaten niet ophalen.');

  }

  async makeSignedRequest(request: axios.AxiosRequestConfig, errorMsg: string) {
    try {
      console.debug('Making signed request: ', request);

      const interceptor = aws4Interceptor({
        region: 'eu-west-1',
        service: 'execute-api',
      }, this.credentials);
      axios.default.interceptors.request.use(interceptor);

      let resp = await axios.default.request(request);
      console.debug(resp);
      if (resp.data) {
        return resp.data;
      } else {
        throw Error(errorMsg);
      }
    } catch (error: any) {
      console.error(error);
      const data = {
        error: error.message,
      };
      return data;
    }
  }

  constructIrmaIssueRequest(brpData: any) {

    // Get persoonsgegevens
    const gegevens = brpData.Persoon.Persoonsgegevens;

    // Calculate age attributes
    // const birthDateStr: string = gegevens.Geboortedatum;
    // const birthDate = parse(birthDateStr, 'dd-MM-yyyy', new Date());
    // const age = differenceInYears(birthDate, new Date());
    // const over12 = age >= 12 ? 'yes' : 'no';
    // const over16 = age >= 16 ? 'yes' : 'no';
    // const over18 = age >= 18 ? 'yes' : 'no';
    // const over21 = age >= 21 ? 'yes' : 'no';
    // const over65 = age >= 65 ? 'yes' : 'no';

    // Return the issue request
    return {
      type: 'issuing',
      credentials: [
        {
          credential: this.demo ? 'irma-demo.gemeente.address' : 'irma.gemeente.address',
          validity: 1678455605, // TODO check if up to date
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
          validity: 1678455605, // TODO check if up to date
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
