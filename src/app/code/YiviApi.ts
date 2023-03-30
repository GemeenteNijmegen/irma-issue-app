import { AWS } from '@gemeentenijmegen/utils';
import { aws4Interceptor } from 'aws4-axios';
import axios, { Axios } from 'axios';
import { DigidLoa, loaToNumber } from './DigiDLoa';

export class YiviApi {

  private host: string;
  private demo: boolean;
  private credentials: {
    accessKeyId: string;
    secretAccessKey: string;
  };
  private apiKey: string;

  constructor() {
    this.host = '';
    this.demo = process.env.YIVI_API_DEMO != 'demo' ? false : true;
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
    if (!process.env.YIVI_API_ACCESS_KEY_ID_ARN || !process.env.YIVI_API_SECRET_KEY_ARN
          || !process.env.YIVI_API_KEY_ARN || !process.env.YIVI_API_HOST) {
      throw Error('Clould not initialize YIVI API client');
    }
    this.host = await AWS.getParameter(process.env.YIVI_API_HOST);
    this.apiKey = await AWS.getSecret(process.env.YIVI_API_KEY_ARN);
    this.credentials = {
      accessKeyId: await AWS.getSecret(process.env.YIVI_API_ACCESS_KEY_ID_ARN),
      secretAccessKey: await AWS.getSecret(process.env.YIVI_API_SECRET_KEY_ARN),
    };
  }

  /**
   * Note: This method should only be used for testing purposes.
   */
  manualInit(host: string, demo: boolean, accesKey: string, secretKey: string, apiKey: string) {
    this.host = host;
    this.demo = demo;
    this.apiKey = apiKey;
    this.credentials = {
      accessKeyId: accesKey,
      secretAccessKey: secretKey,
    };
  }


  async startSession(brpData: any, loa: DigidLoa) {
    const yiviIssueRequest = this.constructYiviIssueRequest(brpData, loa);
    return this.doSignedPostRequest('session', yiviIssueRequest, 'De YIVI sessie kon niet worden gestart.');
  }

  private getSigningClient(): Axios {
    if (!this.credentials.accessKeyId || !this.credentials.secretAccessKey) {
      throw new Error('API client is not configured propperly, missing AWS signature credentials');
    }
    const interceptor = aws4Interceptor({
      region: process.env.AWS_REGION ?? 'eu-west-1',
      service: 'execute-api',
    }, this.credentials);
    const client = axios.create({
      baseURL: `https://${this.host}`,
      timeout: 2000,
      headers: {
        'irma-authorization': this.apiKey,
        'Content-type': 'application/json',
      },
    });
    client.interceptors.request.use(interceptor);
    return client;
  }

  private async doSignedPostRequest(path: string, data: any, errorMsg: string) {
    try {
      const client = this.getSigningClient();
      console.time('request to ' + path);
      const resp = await client.post(path, data);
      if (resp.data) {
        console.timeEnd('request to ' + path);
        return resp.data;
      }
      throw Error(errorMsg);
    } catch (error: any) {
      console.error('Error while doing signed post request for endpoint', path);
      console.timeEnd('request to ' + path);
      if (axios.isAxiosError(error)) {
        if (error.response) {
          // The request was made and the server responded with a status code
          // that falls out of the range of 2xx
          console.log(`http status for ${path}: ${error.response?.status}`);
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
        console.error('Non axios error occured:', error);
      }
      return { error: errorMsg };
    }
  }

  private constructYiviIssueRequest(brpData: any, loa: DigidLoa) {

    // Get persoonsgegevens
    const gegevens = brpData.Persoon.Persoonsgegevens;

    // Calculate validity
    const currentYear = new Date().getFullYear();
    const date5ytd = Math.floor(new Date().setFullYear(currentYear + 5) / 1000); // TODO write tests for date logic
    const date1ytd = Math.floor(new Date().setFullYear(currentYear + 1) / 1000);

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
            digidlevel: `${loaToNumber(loa)}`,
            ...brpData.Persoon.ageLimits,
          },
        },
      ],
    };
  }

}
