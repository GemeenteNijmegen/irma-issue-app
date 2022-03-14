const axios = require('axios');

class BrpClient {


    //https://smallstep.com/hello-mtls/doc/client/axios
//    const { SSMClient, GetParametersCommand } = require("@aws-sdk/client-ssm");
    // const ssmClient = new SSMClient();
        // const paramCommand = new GetParametersCommand({
        //     names: [
        //         process.env.IRMA_ISSUE_SERVER_ENDPOINT_PARAM,
        //         process.env.IRMA_ISSUE_SERVER_IAM_ACCESS_KEY_PARAM,
        //         process.env.IRMA_ISSUE_SERVER_IAM_REGION_PARAM
        //     ]
        // });
        // const parameters = await ssmClient.send(paramCommand);

    
    endpoint = process.env.BRP_IRMA_ENDPOINT;
    
    getBrpIrmaData(bsn){
        const body = {
            "bsn": bsn.toString()
        };

        // TODO Actually access brp

        return {
            "Persoon": {
                "BSN": {
                    "BSN": "999993653"
                },
                "Persoonsgegevens": {
                    "Voorletters": "S.",
                    "Voornamen": "Suzanne",
                    "Voorvoegsel": "",
                    "Geslachtsnaam": "Moulin",
                    "Achternaam": "Moulin",
                    "Naam": "S. Moulin",
                    "Geboortedatum": "01-12-1985",
                    "Geslacht": "V",
                    "NederlandseNationaliteit": "Nee",
                    "Geboorteplaats": "Thann",
                    "Geboorteland": "Canada"
                },
                "Adres": {
                    "Straat": "Boterdiep",
                    "Huisnummer": "31",
                    "Gemeente": "Rotterdam",
                    "Postcode": "3077 AW",
                    "Woonplaats": "Rotterdam"
                },
                "Reisdocument": {
                    "Documentsoort": "",
                    "Documentnummer": "",
                    "Uitgiftedatum": "",
                    "Verloopdatum": ""
                },
                "ageLimits": {
                    "over12": "Yes",
                    "over16": "Yes",
                    "over18": "Yes",
                    "over21": "Yes",
                    "over65": "No"
                }
            }
        };
    }


}
exports.BrpClient = BrpClient;