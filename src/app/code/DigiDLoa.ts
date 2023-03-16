/**
 * DigiD common LOA names mapped to SAML2.0 names
 */
export enum DigidLoa {
  Basis = 'urn:oasis:names:tc:SAML:2.0:ac:classes:PasswordProtectedTransport',
  Midden = 'urn:oasis:names:tc:SAML:2.0:ac:classes:MobileTwoFactorContract',
  Substantieel = 'urn:oasis:names:tc:SAML:2.0:ac:classes:Smartcard',
  Hoog = 'urn:oasis:names:tc:SAML:2.0:ac:classes:SmartcardPKI',
}

/**
 * Given a DigiD LOA, proved a value that can be used to issue
 * the Yivi DigiDLevel attribute.
 * From the old issue app (https://github.com/GemeenteNijmegen/irma-brp-opladen) we know that
 * there are 4 valid values:
 * - 10 = Basis
 * - 20 = Midden
 * - 25 = Substantieel
 * - 30 = Hoog
 */
export function loaToNumber(loa: DigidLoa) {
  switch (loa) {
    case DigidLoa.Hoog:
      return 30;
    case DigidLoa.Substantieel:
      return 25;
    case DigidLoa.Midden:
      return 20;
    case DigidLoa.Basis:
      return 10;
    default:
      return 0;
  }
}