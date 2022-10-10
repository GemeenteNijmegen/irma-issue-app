const { ApiClient } = require("@gemeentenijmegen/apiclient");
const { default: axios } = require("axios");

class IrmaApi {
    constructor(endpoint, demo) {
        this.endpoint = endpoint;
        this.demo = demo;
    }

    async startSession(brpData) {
        try {
            const irmaIssueRequest = this.constructIrmaIssueRequest(brpData);
            let resp = await axios.post(this.endpoint, irmaIssueRequest, {
                headers: {'Content-type': 'application/json'}
            });
            if(resp.data) {
                return resp.data;
            } else {
                throw new Error('De IRMA sessie kon niet worden gestart.');
            }
        } catch (error) {
            const data = {
                'error' : error.message
            }
            return data;
        }
    }

    constructIrmaIssueRequest(brpData){
        console.log(brpData);
        return {
            "type":"issuing",
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
                        "surname":"Test",
                        "cityofbirth":"Nijmegen",
                        "countryofbirth":"Nederland",
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