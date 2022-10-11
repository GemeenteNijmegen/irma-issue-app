
class IrmaApiMock {

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
       // NOP
    }

    async getSecret(arn) {
        // NOP
    }

    async startSession(brpData) {
        const url = `https://${this.host}/irma/session`;
        console.info('MOCKING url start session', url);
        return {
            sessionPtr: {
                u: url,
                type: 'issuing'
            }, 
            token: 'wegoiwejg9302'
        }
    }

    async getSessionResult(token) {
        const url = `https://${baseUrl}/irma/session/${token}/result`;
        console.info('MOCKING url get session result', url);
        return {
            status: 'bowejgoweij',
            token: 'wegoiwejg9302'
        }
    }

}

exports.IrmaApiMock = IrmaApiMock;