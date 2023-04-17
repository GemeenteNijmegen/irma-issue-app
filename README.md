# Yivi issue app

This repository contains the infra as code and application code of the Yivi issue application, or in dutch Yivi verstrekkingen.
The application enables users that have authenticated using DigiD to load their personal data from the basisregistratie personen (BRP) into Yivi.



## Workload move
Todo: move this workload to our new LZ:
- Create new branch + configuration for new lz, e.g. `acceptance-new-lz`
- Deploy app to new lz account (make sure manual dns forwarding is done from the old csp hz to the new hz)
- Start using the new LZ version (update cname records nijmegen.nl)
- Undeploy pipeline in old lz for `acceptance`
- Update configuration of `acceptance` with new configuration from `acceptance-new-lz` on branch `acceptance-new-lz`
- Merge `acceptance-new-lz` back to acceptance
- Change change name to `acceptance` for configuration `acceptance-new-lz` on branch `acceptance-new-lz` and push the change
  - Pipeline will be recreated under the `acceptance` name and checkout the `acceptance` branch that is now identical to the `acceptance-new-lz` branch.
- Remove `acceptance-new-lz` branch