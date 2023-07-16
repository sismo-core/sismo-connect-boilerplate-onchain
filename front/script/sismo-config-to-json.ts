import { CONFIG, AUTHS, CLAIMS } from "../src/app/sismo-connect-config";

const printSismoConfigJson = (): void => {
  const impersonate = CONFIG?.vault?.impersonate;
  console.log(
    JSON.stringify(
      {
        appId: CONFIG.appId,
        isImpersonationMode: impersonate ? impersonate.length > 0 : false,
        authRequests: AUTHS,
        claimRequests: CLAIMS,
        // signatureRequest: SIGNATURE_REQUEST,
      },
      null,
      2
    )
  );
};
printSismoConfigJson();
