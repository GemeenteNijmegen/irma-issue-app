const axios = require('axios').default;
const https = require('https');
const { SSMClient, GetParameterCommand } = require("@aws-sdk/client-ssm");
const { SecretsManagerClient, GetSecretValueCommand } = require('@aws-sdk/client-secrets-manager');

class BrpClient {
        
    endpoint = '';
    certificate = '';
    certificateKey = '';
    httpsAgent = undefined;


    async initializeParameters(){
        
        // Load the certificate from the parameter 
        // store as it is to big for an environment variable
        const ssmClient = new SSMClient();
        const paramCommand = new GetParameterCommand({
            Name: process.env.BRP_CERTIFICATE_PARAM_NAME
        });
        const parameter = await ssmClient.send(paramCommand);
        this.certificate = parameter.Parameter.Value;
        
        // Get the certificate key from the secret store
        const client = new SecretsManagerClient();
        const command = new GetSecretValueCommand({ SecretId: process.env.BRP_CERTIFICATE_KEY_ARN });
        const key = await client.send(command);
        if (key.SecretBinary !== undefined) {
            throw 'Key is provided as binary. Please make sure it is supplied as a SecretString';
        }
        this.certificateKey = key.SecretString;
    
        // Set the endpoint
        this.endpoint = process.env.BRP_IRMA_ENDPOINT;

        // Create the https agent
        this.httpsAgent = new https.Agent({
            cert: this.certificate,
            key: this.certificateKey
        });

    }
    
    async getBrpIrmaData(bsn){
        const body = { "bsn": bsn };

        const response = await axios.get(this.endpoint,  { 
            httpAgent: this.httpsAgent, 
            data: JSON.stringify(body)
         });

        return response.data;

        // return {
        //     "Persoon": {
        //         "BSN": {
        //             "BSN": "999993653"
        //         },
        //         "Persoonsgegevens": {
        //             "Voorletters": "S.",
        //             "Voornamen": "Suzanne",
        //             "Voorvoegsel": "",
        //             "Geslachtsnaam": "Moulin",
        //             "Achternaam": "Moulin",
        //             "Naam": "S. Moulin",
        //             "Geboortedatum": "01-12-1985",
        //             "Geslacht": "V",
        //             "NederlandseNationaliteit": "Nee",
        //             "Geboorteplaats": "Thann",
        //             "Geboorteland": "Canada"
        //         },
        //         "Adres": {
        //             "Straat": "Boterdiep",
        //             "Huisnummer": "31",
        //             "Gemeente": "Rotterdam",
        //             "Postcode": "3077 AW",
        //             "Woonplaats": "Rotterdam"
        //         },
        //         "Reisdocument": {
        //             "Documentsoort": "",
        //             "Documentnummer": "",
        //             "Uitgiftedatum": "",
        //             "Verloopdatum": ""
        //         },
        //         "ageLimits": {
        //             "over12": "Yes",
        //             "over16": "Yes",
        //             "over18": "Yes",
        //             "over21": "Yes",
        //             "over65": "No"
        //         }
        //     }
        // };
    }


}
exports.BrpClient = BrpClient;