
const { SecretsManagerClient, GetSecretValueCommand } = require('@aws-sdk/client-secrets-manager');
const axios = require('axios').default;
const aws4Interceptor = require('aws4-axios');

class IrmaClient {
    endpoint = '';
    awsAccessKey = '';
    awsSecretKey = '';
    awsRegion = 'eu-west-1';
    awsService = 'execute-api';
    irmaNamespace = '';
    irmaApiKey = '';

    interceptor = undefined;

    /**
     * Retrieve client secret from secrets manager
     * 
     * @returns string the client secret
     */
    async initializeParameters() {

        this.awsAccessKey = process.env.IRMA_ISSUE_SERVER_IAM_ACCESS_KEY;
        this.awsRegion = process.env.IRMA_ISSUE_SERVER_IAM_REGION;
        this.endpoint = process.env.IRMA_ISSUE_SERVER_ENDPOINT;
        this.irmaNamespace = process.env.IRMA_NAMESPACE;
        console.debug("Initialized non secret values", this.awsAccessKey, this.awsRegion, this.endpoint, this.irmaNamespace);

        const secretsManagerClient = new SecretsManagerClient();
        this.awsSecretKey = await this._getSecretString(secretsManagerClient, process.env.IRMA_ISSUE_SERVER_IAM_SECRET_KEY_ARN);
        this.irmaApiKey = await this._getSecretString(secretsManagerClient, process.env.IRMA_API_KEY_ARN);


        this.interceptor = aws4Interceptor({
            region: this.region,
            service: this.awsService,
        }, {
            accessKeyId: this.awsAccessKey,
            secretAccessKey: this.awsSecretKey,
        });


        console.debug("Finished initalization of IRMA client");
    }

    async _getSecretString(client, arn) {
        const command = new GetSecretValueCommand({ SecretId: arn });
        const data = await client.send(command);
        if (data.SecretBinary !== undefined) {
            throw 'Secret is provided as binary. Please make sure it is supplied as a SecretString';
        }
        return data.SecretString;
    }

    startIrmaSession(data) {
        const person = data.Persoon.Persoonsgegevens;
        const age = data.Persoon.ageLimits;
        const address = data.Persoon.Adres;

        // Current date + 1 year
        const validity = new Date(new Date().setFullYear(new Date().getFullYear() + 1));

        const body = {
            "type": "issuing",
            "credentials": [
                {
                    "credential": this.irmaNamespace + ".gemeente.address",
                    "validity": validity.valueOf(),
                    "attributes": {
                        "street": address.Straat,
                        "houseNumber": address.Huisnummer,
                        "zipcode": address.Postcode,
                        "municipality": address.Gemeente,
                        "city": address.Woonplaats
                    }
                },
                {
                    "credential": this.irmaNamespace + ".gemeente.personalData",
                    "validity": validity.valueOf(),
                    "attributes": {
                        "initials": person.Voorletters,
                        "firstnames": person.Voornaamen,
                        "prefix": person.Voorvoegsel,
                        "familyname": person.Geslachtsnaam,
                        "fullname": person.Naam,
                        "dateofbirth": person.Geboortedatum,
                        "gender": person.Geslacht,
                        "nationality": person.NederlandseNationaliteit, // Check if yes no value is sufficient?
                        "surname": person.Achternaam,
                        "cityofbirth": person.Geboorteplaats,
                        "countryofbirth": person.Geboorteland,
                        "over12": age.over12,
                        "over16": age.over16,
                        "over18": age.over18,
                        "over21": age.over21,
                        "over65": age.over65,
                        "bsn": data.Persoon.BSN.BSN,
                        "digidlevel": "${betrouwbaarheidsniveau-tekst}" // Check if in digid response
                    }
                }
            ]
        }

        // const awsCredentials = {
        //     accessKeyId: this.awsAccessKey,
        //     secretAccessKey: this.awsSecretKey
        // }
        // aws4.sign({
        //     host: this.endpoint,
        //     method: 'POST',
        //     path: '/session',
        //     service: this.awsService,
        //     region: this.awsRegion,
        //     headers: {
        //         'irma-Authorization': this.irmaApiKey
        //     },
        //     body: JSON.stringify(data)
        // }, awsCredentials)


        const client = axios.create();
        client.interceptors.request.use(this.interceptor);

        axios.post(this.endpoint, body, {
            headers: {
                'irma-Authorization': this.irmaApiKey
            }
        });

    }

}
exports.IrmaClient = IrmaClient;