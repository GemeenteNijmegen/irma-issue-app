import { AWS } from '@gemeentenijmegen/utils';
import { Issuer, generators } from 'openid-client';

export class OpenIDConnect {

  private issuer?: Issuer;
  private authBaseUrl?: string;
  private applicationBaseUrl?: string;
  private oidcClientId?: string;
  private oidcClientSecret?: string;
  private oidcScope?: string;

  /**
   * Helper class for our OIDC auth flow
   */
  constructor() {}

  async init() {
    if (!process.env.AUTH_URL_BASE_SSM || !process.env.OIDC_CLIENT_ID_SSM || !process.env.APPLICATION_URL_BASE || !process.env.OIDC_SCOPE_SSM) {
      let errorMsg = 'Initalization failed: one of the folowing env variables is missing:';
      errorMsg += [
        'AUTH_URL_BASE_SSM',
        'OIDC_CLIENT_ID_SSM',
        'APPLICATION_URL_BASE',
        'OIDC_SCOPE_SSM',
      ].join(', ');
      throw Error(errorMsg);
    }
    this.authBaseUrl = process.env.AUTH_URL_BASE_SSM;
    this.oidcClientId = process.env.OIDC_CLIENT_ID_SSM;
    this.oidcScope = process.env.OIDC_SCOPE_SSM;

    this.issuer = this.getIssuer(this.authBaseUrl);
    this.applicationBaseUrl = process.env.APPLICATION_URL_BASE;
  }

  async getOidcClientSecret() {
    if (!this.oidcClientSecret) {
      if (!process.env.CLIENT_SECRET_ARN) {
        throw Error('process.env.CLIENT_SECRET_ARN not configured');
      }
      this.oidcClientSecret = await AWS.getSecret(process.env.CLIENT_SECRET_ARN);
    }
    return this.oidcClientSecret;
  }

  /**
     * setup the oidc issuer. For now using env. parameters & hardcoded urls
     * Issuer could also be discovered based on file in .well-known, this
     * should be cached somehow.
     *
     * @returns openid-client Issuer
     */
  getIssuer(url: string) {
    const issuer = new Issuer({
      issuer: `${url}/broker/sp/oidc`,
      authorization_endpoint: `${url}/broker/sp/oidc/authenticate`,
      token_endpoint: `${url}/broker/sp/oidc/token`,
      jwks_uri: `${url}/broker/sp/oidc/certs`,
      userinfo_endpoint: `${url}/broker/sp/oidc/userinfo`,
      revocation_endpoint: `${url}/broker/sp/oidc/token/revoke`,
      introspection_endpoint: `${url}/broker/sp/oidc/token/introspect`,
      end_session_endpoint: `${url}/broker/sp/oidc/logout`,
      token_endpoint_auth_methods_supported: ['client_secret_post', 'client_secret_basic'],
      introspection_endpoint_auth_methods_supported: ['client_secret_post', 'client_secret_basic'],
      revocation_endpoint_auth_methods_supported: ['client_secret_post', 'client_secret_basic'],
      //revocation_endpoint_auth_methods_supported: "RS256"
    });
    return issuer;
  }

  /**
     * Get the login url for the OIDC-provider.
     * @param {string} state A string parameter that gets returned in the auth callback.
     * This should be checked before accepting the login response.
     * @returns {string} the login url
     */
  getLoginUrl(state: string) {
    if (!this.issuer || !this.applicationBaseUrl || !this.oidcClientId) {
      throw Error('Client not (correctly) initalized!');
    }
    const base_url = new URL(this.applicationBaseUrl);
    const redirect_uri = new URL('/auth', base_url);
    const client = new this.issuer.Client({
      client_id: this.oidcClientId,
      redirect_uris: [redirect_uri.toString()],
      response_types: ['code'],
    });
    const authUrl = client.authorizationUrl({
      scope: this.oidcScope,
      resource: this.authBaseUrl,
      state: state,
    });
    return authUrl;
  }

  /**
     * Use the returned code from the OIDC-provider and stored state param
     * to complete the login flow.
     *
     * @param {string} code
     * @param {string} state
     * @returns {object | false} returns a claims object on succesful auth
     */
  async authorize(code: string, state: string, returnedState: string | false) {
    if (!this.issuer || !this.applicationBaseUrl || !this.oidcClientId) {
      throw Error('Client not (correctly) initialized!');
    }
    const base_url = new URL(this.applicationBaseUrl);
    const redirect_uri = new URL('/auth', base_url);
    const client_secret = await this.getOidcClientSecret();
    const client = new this.issuer.Client({
      client_id: this.oidcClientId,
      redirect_uris: [redirect_uri.toString()],
      client_secret: client_secret,
      response_types: ['code'],
    });
    const params = client.callbackParams(redirect_uri + '/?code=' + code + '&state=' + returnedState);
    if (state !== returnedState) {
      throw new Error('state does not match session state');
    }
    let tokenSet;
    try {
      tokenSet = await client.callback(redirect_uri.toString(), params, { state: state });
    } catch (err: any) {
      throw new Error(`${err.error} ${err.error_description}`);
    }
    const claims = tokenSet.claims();
    if (claims.aud != this.oidcClientId) {
      throw new Error('claims aud does not match client id');
    }
    return claims;

  }

  generateState() {
    return generators.state();
  }
}
