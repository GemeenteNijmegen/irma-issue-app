const session = JSON.parse(document.getElementById("session").value);
const irmaServer = document.getElementById("irmaServer").value;
const sessionResultEndpoint = document.getElementById("sessionResultEndpoint").value;

const exampleWeb = irma.newWeb({
        debugging: true,
        element: '#irma-web-form',
        session: {
            url: irmaServer,
            start: false,
            mapping: {
                sessionPtr: r => { return session.sessionPtr },
                sessionToken: r => { return session.token },
            },
            result: {
                url:           (o, {sessionPtr, sessionToken}) => `${sessionResultEndpoint}?token=${sessionToken}`,
                parseResponse: r => r.json()
            }
        },
        state: {
            serverSentEvents: false,
        }

    });

    exampleWeb.start()
        .then(result => console.log("Successful disclosure! 🎉", result))
        .catch(error => console.error("Couldn't do what you asked 😢", error));