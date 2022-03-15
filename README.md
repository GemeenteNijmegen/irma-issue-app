# IRMA issue app

This AWS CDK app contains the infrastructure as code for the serverless webapp that issues brp data to irma.

The lambdas that are defined are:
- auth (landing endpoint after digid authentication)
- authorized (lambda for basic authentication)
- home (home page)
- issue (loads brp data, starts irma session, shows irma qr code)
- manual_auth (bypass digid authentication, only for accp)

