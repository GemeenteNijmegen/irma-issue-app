# Disclose flow mijn-nijmegen

Dit diagram beschrijft de flow van data bij disclosure tbv het inloggen bij mijn.nijmegen.nl. Dit beschrijft het deel waar Gemeente Nijmegen zelf invloed op heeft. Signicat maakt gebruik van een Yivi omgeving om de Yivi disclosure sessie te doen. Meer details over de disclosure sessie kan je vinden op https://irma.app/docs/irma-protocol/#sequence-diagram

```mermaid
sequenceDiagram
autonumber

title Yivi disclosure personal data flow for mijn.nijmegen.nl

participant User
participant YiviApp
participant Browser
participant MijnNijmegen
participant Signicat

note over User, Signicat: Start login flow
User-->>Browser: Go to mijn.nijmegen.nl/login

Browser->>MijnNijmegen: Request /login
MijnNijmegen-->>Browser: Webpagina

note over User, Signicat: Authenticatie via Signicat (authenticatie broaker)

User-->>Browser: Chooses Yivi for authentication
Browser->>Signicat: Request /authenticate (AttributesToDisclose=[BSN])
note over Signicat: Start Yivi disclosure session<br/>See Yivi documentation for technical details.
Signicat->>Browser: Laat QR code zien

User-->>YiviApp: Opens app and click scan QR code
YiviApp-->>Browser: Scan QR code
Browser->>Signicat: Done?
Signicat-->>Browser: No

YiviApp->>Signicat: What attributes to disclose?
Signicat-->>YiviApp: AttributesToDisclose=[BSN]


YiviApp-->>User: Do you want to disclose attributes (AttributesToDisclose=[BSN])?
User-->>YiviApp: Confirm

YiviApp->>Signicat: Disclose attributes (BSN)
Browser->>Signicat: Done?
Signicat-->>Browser: Yes



Browser->>MijnNijmegen: Redirect /auth
MijnNijmegen->>Signicat: Get disclosed data
Signicat-->>MijnNijmegen: disclosed data (BSN)
note over Signicat: End Yivi disclosure session

MijnNijmegen->>MijnNijmegen: Store disclosed data in session
MijnNijmegen-->>Browser: Redirect /
Browser->>MijnNijmegen: Request /
MijnNijmegen-->>Browser: Webpagina

```
