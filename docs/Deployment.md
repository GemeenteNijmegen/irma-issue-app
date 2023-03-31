# Deployment process

Steps:
1. Make sure a [configuration](../src/Configuration.ts) exists for the current branch and the branch is pushed to git.
  - Pay attention to the demo configuration
  - Check the regions before deploying to the new LZ
2. Clear the cdk.out directory and set the `BRANCH_NAME` environment variable to the branch to deploy
3. Build the project `yarn build`
4. Set the CLI to the correct deployment/build account to deploy to
5. run `npx cdk deploy -a cdk.out --all`
6. After deployment the application parameters and secrets should be configured as below.

## Parameters

### Signicat
Parameters:
-	/cdk/yivi-issue-app/authClientID
- /cdk/yivi-issue-app/authScope
- /cdk/yivi-issue-app/authUrlBase

Secrets:
- /cdk/yivi-issue-app/oidc-clientsecret

### BRP 
Parameters:
- /cdk/yivi-issue-app/brp-api-url
- /cdk/yivi-issue-app/mtls-clientcert
- /cdk/yivi-issue-app/mtls-rootca

Secrets: 
- /cdk/yivi-issue-app/mtls-privatekey

### Yivi server
Parameters:
- /cdk/yivi-issue-app/yivi-api-host (note: only hostname e.g gw.nijmegen.nl, no protocol or path)

Secrets:
- /cdk/yivi-issue-app/yivi-api-access-key-id
- /cdk/yivi-issue-app/yivi-api-secret-key
- /cdk/yivi-issue-app/yivi-api-key