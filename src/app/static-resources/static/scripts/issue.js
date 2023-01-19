const sessionPtrU = document.getElementById("session-ptr-u").getAttribute('data');
const sessionPtrQr = document.getElementById("session-ptr-qr").getAttribute('data');
const yiviServer = document.getElementById("yiviServer").getAttribute('data');

const yiviClient = yivi.newWeb({
    debugging: true,
    element: '#yivi-web-form',
    session: {
        url: yiviServer,
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

yiviClient.start()
    .then(() => { // Hide QR show success message
        document.getElementById('yivi-form').classList.add("hidden");
        document.getElementById('success').classList.remove("hidden");
        fetch('/callback?result=success')
            .then(() => console.log('Callback succesfull'))
            .catch(err => console.log('Callback failed', err));
    })
    .catch((err) => { // Hide QR show error message
        document.getElementById('yivi-form').classList.add("hidden");
        document.getElementById('failed-yivi').classList.remove("hidden");
        fetch(encodeURI('/callback?result=failure&error=' + err))
            .then(() => console.log('Callback succesfull'))
            .catch(err => console.log('Callback failed', err));
    });
