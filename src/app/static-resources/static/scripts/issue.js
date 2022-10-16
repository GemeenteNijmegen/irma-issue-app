const sessionPtrU = document.getElementById("session-ptr-u").value;
const sessionPtrQr = document.getElementById("session-ptr-qr").value;
const irmaServer = document.getElementById("irmaServer").value;
const sessionResultEndpoint = document.getElementById("sessionResultEndpoint").value;

const irmaClient = irma.newWeb({
    debugging: true,
    element: '#irma-web-form',
    session: {
        url: irmaServer,
        start: false, // No need to start session from the browser (done server-sied)
        mapping: {
            sessionPtr: r => { return { "u": sessionPtrU, "irmaqr": sessionPtrQr } },
        },
        result: false, // No need to fetch session result (status success / failed is sufficient)
    },
    state: {
        serverSentEvents: false,
    }
});

irmaClient.start() 
    .then(() => { // Hide QR show success message
        document.getElementById('irma-form').classList.add("hidden");
        document.getElementById('success').classList.remove("hidden");
    })
    .catch(() => { // Hide QR show error message
        document.getElementById('irma-form').classList.add("hidden");
        document.getElementById('failed-irma').classList.remove("hidden");
    });