import { DynamoDBClient, DynamoDBClientResolvedConfig, GetItemCommand, GetItemCommandOutput, ServiceInputTypes, ServiceOutputTypes } from "@aws-sdk/client-dynamodb";
import { ApiClient } from "@gemeentenijmegen/apiclient";
import { AwsStub } from "aws-sdk-client-mock";
import { DigidLoa } from "../../src/app/code/DigiDLoa";
import { BrpApi } from "../../src/app/issue/BrpApi";


export class TestUtils {

  static async getBrpApi(){
    if(!process.env.BRP_API_URL){
      process.env.BRP_API_URL = 'https://example.com/brp/api/test';
    }
    const apiClient = new ApiClient('cert', 'key', 'ca');
    const brpApi = new BrpApi(apiClient);
    await brpApi.init();
    return brpApi;
  }

  static getSessionStoreMock(
    ddMock: AwsStub<ServiceInputTypes, ServiceOutputTypes, DynamoDBClientResolvedConfig>,
    loggedin: boolean = true,
    bsn: string = '900026236',
    state: string = '12345',
    loa: DigidLoa = DigidLoa.Midden,
    additional: any = undefined,
  ) {
    const dynamoDBClient = new DynamoDBClient({ region: 'us-east-1' });
    const getItemOutput: Partial<GetItemCommandOutput> = {
      Item: {
        data: {
          M: {
            loggedin: { BOOL: loggedin },
            bsn: { S: bsn },
            state: { S: state },
            loa: { S: loa },
            ...additional
          },
        },
      },
    };
    ddMock.on(GetItemCommand).resolves(getItemOutput);
    return dynamoDBClient;
  }

  static getYiviSessionExampleResponse() {

    const sessionResponse = {
      sessionPtr: {
        u: 'https://gw-test.nijmegen.nl/yivi/session/anothertoken',
        yiviqr: 'issuing'
      },
      token: 'sometoken',
      frontendRequest: {
        authorization: 'blabla',
        pairingHint: true,
        minProtocolVersion: '1.0',
        maxProtocolVersion: '1.1'
      }
    }
    return sessionResponse;
  }

  static getBrpExampleData() {
    const brpData = {
      "Persoon": {
        "BSN": {
          "BSN": "900026236"
        },
        "Persoonsgegevens": {
          "Voorletters": "H.",
          "Voornamen": "Hans",
          "Voorvoegsel": "de",
          "Geslachtsnaam": "Jong",
          "Achternaam": "de Jong",
          "Naam": "H. de Jong",
          "Geboortedatum": "01-01-1956",
          "Geslacht": "M",
          "NederlandseNationaliteit": "Ja",
          "Geboorteplaats": "Nijmegen",
          "Geboorteland": "Nederland"
        },
        "Adres": {
          "Straat": "Kelfkensbos",
          "Huisnummer": "80",
          "Gemeente": "Nijmegen",
          "Postcode": "6511 RN",
          "Woonplaats": "Nijmegen"
        },
        "ageLimits": {
          "over12": "Yes",
          "over16": "Yes",
          "over18": "Yes",
          "over21": "Yes",
          "over65": "Yes"
        }
      }
    }
    return brpData;
  }

}