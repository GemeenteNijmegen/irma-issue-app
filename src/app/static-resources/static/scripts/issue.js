const sessionPtrU = document.getElementById("session-ptr-u").getAttribute('data');
const sessionPtrQr = document.getElementById("session-ptr-qr").getAttribute('data');
const yiviServer = document.getElementById("yiviServer").getAttribute('data');

// Get the session response
const yiviFullSessionEncoded = document.getElementById("yiviFullSession").getAttribute('data');
const yiviFullSession = JSON.parse(Buffer.from(yiviFullSessionEncoded, 'base64').toString("utf-8"));

const yiviClient = yivi.newWeb({
    debugging: true,
    element: '#yivi-web-form',
    session: {
        url: yiviServer,
        start: false, // No need to start session from the browser (done server-sied)
        mapping: {
            sessionPtr:      r => yiviFullSession.sessionPtr,
            sessionToken:    r => yiviFullSession.token,
            frontendRequest: r => yiviFullSession.frontendRequest
        },
        result: false, // No need to fetch session result (status success / failed is sufficient)
    },
    state: {
        serverSentEvents: false,
        frontendOptions: {
            endpoint:           'options',
            requestContext:     'https://irma.app/ld/request/options/v1'
        },
        pairing: {
            onlyEnableIf:      m => yiviFullSession.frontendRequest.pairingHint,
            completedEndpoint: 'pairingcompleted',
            minCheckingDelay:  500, // Minimum delay before accepting or rejecting a pairing code, for better user experience.
            pairingMethod:     'pin'
        }
    }
});

yiviClient.start()
    .then(() => {
        fetch('/callback?result=success')
            .then(() => console.log('Callback succesfull'))
            .catch(err => console.log('Callback failed', err));
    })
    .catch((err) => {
        document.getElementById('retry-button').classList.remove('hidden');
        fetch(encodeURI('/callback?result=failure&error=' + err))
            .then(() => console.log('Callback succesfull'))
            .catch(err => console.log('Callback failed', err));
    });
