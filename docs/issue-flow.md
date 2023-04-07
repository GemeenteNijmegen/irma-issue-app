# Issue flow

Issuing of credentials can be described by the following diagram. We use CloudFront as the CDN for the web-facing part of the application. In the diagram:
- **blue**: Parts of the flow that are region-dependent. These are routed over the public internet to/from AWS edge locations (usually in Europe, can flow through the US).
- **red**: Parts of the flow that carry personal information. These are all hosted in/routed within the EU.

```mermaid
sequenceDiagram
autonumber

title Yivi issue personal data flow

participant Browser
box rgb(191, 223, 255) Region-dependent
participant CloudFront
end
participant Lambda
participant Session
participant "Issue-server"
participant Signicat
participant BRP
participant "Yivi-app"


note over "Yivi-app", Browser: Start login flow
"Yivi-app"-->>Browser: Open browser at yivi.nijmegen.nl

rect rgb(191, 223, 255)
Browser->>CloudFront: Request /login (session id)
CloudFront->>Lambda: 
Lambda->>CloudFront: Render page (auth url)
CloudFront->>Browser: 200 Response
end

Browser->>Signicat: DigiD login request
note over Signicat: User and Signicat perform DigiD authentication
Signicat->>Browser: 302 Redirect to /auth


note over "Yivi-app", Browser: Authentication

rect rgb(191, 223, 255)
Browser->>CloudFront: Request /auth  (session id)
CloudFront->>Lambda: 
end
Lambda->>Signicat: Obtain access token

rect rgb(255, 170, 165)
Signicat->>Lambda: Return access token (incl. BSN)
Lambda->>Lambda: Check claims
Lambda->>Session: Store BSN in session
end
rect rgb(191, 223, 255)
Lambda->>CloudFront: 
CloudFront->>Browser: 302 redirect to /
end

note over "Yivi-app", Browser: Start Yivi issue flow
rect rgb(191, 223, 255)
Browser->>CloudFront: Request /  (session id)
CloudFront->>Lambda: 
end
Lambda->>Session: Request session
rect rgb(255, 170, 165)
Session->>Lambda: Return session (incl. BSN)
Lambda->>BRP: Obtain personal data (key=BSN)
BRP->>Lambda: 
Lambda->>"Issue-server": Start session (personal data)
end
"Issue-server"->>Lambda: Session pointer
rect rgb(191, 223, 255)
Lambda->>CloudFront: Render page (session pointer)
CloudFront->>Browser: 200 Response
end
Browser->>Browser: Render session pointer QR code
Browser->>"Issue-server": Poll session status
"Issue-server"->>Browser: Status NOT DONE
"Yivi-app"->>Browser: Scan QR-code
Browser->>"Yivi-app": 
rect rgb(255, 170, 165)
"Yivi-app"->>"Issue-server": Obtain Yivi attributes
"Issue-server"->>"Yivi-app": 
end
Browser->>"Issue-server": Poll session status
"Issue-server"->>Browser: Status DONE
```