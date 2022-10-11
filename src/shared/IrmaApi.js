const { axios } = require("axios");
const { aws4 } = require("aws4");
const { SecretsManagerClient, GetSecretValueCommand } = require('@aws-sdk/client-secrets-manager');

class IrmaApi {

    constructor(host, demo=false, accessKey=undefined, secretKey=undefined, apiKey=undefined) {
        this.host = host ? host : process.env.IRMA_API_HOST;
        this.demo = demo ? demo : process.env.IRMA_API_DEMO;
        
        this.credentials = {
            accessKeyId: accessKey,
            secretKey: secretKey,
        };
        this.apiKey = apiKey;
    }

    async init(){
        if (!process.env.IRMA_API_ACCESS_KEY_ARN || !process.env.IRMA_API_SECRET_KEY_ARN || !process.env.IRMA_API_KEY_ARN) {
            throw Error("Clould not initialize IRMA API client");
        }
        this.apiKey = await this.getSecret(process.env.IRMA_API_KEY_ARN);
        this.credentials = {
            accessKeyId: await this.getSecret(process.env.IRMA_API_ACCESS_KEY_ARN),
            secretAccessKey: await this.getSecret(process.env.IRMA_API_SECRET_KEY_ARN)
        }
    }

    async getSecret(arn) {
        if (!arn) {
            throw new Error("No ARN provided");
        }
        const secretsManagerClient = new SecretsManagerClient({});
        const command = new GetSecretValueCommand({ SecretId: arn });
        const data = await secretsManagerClient.send(command);
        if (data?.SecretString) {
            return data.SecretString;
        } 
        throw new Error('No secret value found');
    }

    async startSession(brpData) {

        const url = `https://${this.host}/irma/session`;

        let irmaIssueRequest = {
            region: 'eu-west-1',
            service: 'execute-api',
            method: "GET",
            host: this.host,
            url: url,
            body: this.constructIrmaIssueRequest(brpData),
            path: "/irma/session",
            headers: {
                "irma-authorization": "APIKEY",
                'Content-type': 'application/json',
            }
        }

        return await this.makeSignedRequest(irmaIssueRequest, "De IRMA sessie kon niet worden gestart.");

    }

    async getSessionResult(token) {

        const url = `https://${baseUrl}/irma/session/${token}/result`;

        const sessionResultRequest = {
            region: 'eu-west-1',
            service: 'execute-api',
            host: baseUrl,
            method: "GET",
            url: url,
            path: `/irma/session/${token}/result`,
            headers: {
                "irma-authorization": "APIKEY",
            }
        }

        return await this.makeSignedRequest(sessionResultRequest, "Could not get session result from IRMA server");

    }

    async makeSignedRequest(request, errorMsg) {
        try {
            let resp = await axios.get(aws4.sign(request, this.credentials));
            if (resp.data) {
                return resp.data;
            } else {
                throw Error(errorMsg);
            }
        } catch (error) {
            const data = {
                'error': error.message
            }
            return data;
        }
    }

    constructIrmaIssueRequest(brpData) {
        console.log(brpData);
        return {
            "type": "issuing",
            "credentials": [
                {
                    "credential": demo ? "irma-demo.gemeente.address" : "irma.gemeente.address",
                    "validity": 1678455605,
                    "attributes": {
                        "street": "Kortestraat",
                        "houseNumber": "6",
                        "zipcode": "6511PP",
                        "municipality": "Nijmegen",
                        "city": "Nijmegen"
                    }
                },
                {
                    "credential": demo ? "irma-demo.gemeente.personalData" : "irma.gemeente.personalData",
                    "validity": 1678455605,
                    "attributes": {
                        "initials": "",
                        "firstnames": "Test",
                        "prefix": "",
                        "familyname": "Test",
                        "fullname": "Test Test",
                        "dateofbirth": "20-10-1996",
                        "gender": "M",
                        "nationality": "yes",
                        "surname": "Test",
                        "cityofbirth": "Nijmegen",
                        "countryofbirth": "Nederland",
                        "over12": "yes",
                        "over16": "yes",
                        "over18": "yes",
                        "over21": "yes",
                        "over65": "no",
                        "bsn": "1234",
                        "digidlevel": "12"
                    }
                }
            ]
        }
    }

}

exports.IrmaApi = IrmaApi;