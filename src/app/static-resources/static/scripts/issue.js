const sessionToken = document.getElementById("session-token").value;
const sessionPtrU = document.getElementById("session-ptr-u").value;
const sessionPtrQr = document.getElementById("session-ptr-qr").value;
const irmaServer = document.getElementById("irmaServer").value;
const sessionResultEndpoint = document.getElementById("sessionResultEndpoint").value;

const irmaClient = irma.newWeb({
    debugging: true,
    element: '#irma-web-form',
    session: {
        url: irmaServer,
        start: false,
        mapping: {
            sessionPtr: r => { return { "u": sessionPtrU, "irmaqr": sessionPtrQr } },
            sessionToken: r => { return sessionToken },
        },
        result: {
            url: (o, {ptr, token}) => `${sessionResultEndpoint}?token=${token}`,
            parseResponse: r => r.json()
        }
    },
    state: {
        serverSentEvents: false,
    }
});

irmaClient.start()
    .then(result => console.log("Successful disclosure! 🎉", result))
    .catch(error => console.error("Couldn't do what you asked 😢", error));