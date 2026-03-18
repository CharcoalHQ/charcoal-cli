import { WORKOS_BASE_URL, WORKOS_CLIENT_ID } from '../constants.js';
import { type Credentials, loadCredentials, saveCredentials } from './credentials.js';
import { performOAuthLogin } from './oauth.js';

interface AuthenticateResponse {
  access_token: string;
  refresh_token: string;
  expires_in?: number;
  user: { id: string; email: string };
}

/**
 * Exchange a refresh token for an org-scoped access token.
 * Used during login flow with transient tokens (not persisted).
 */
export async function refreshTokenForOrg(
  refreshToken: string,
  organizationId: string,
): Promise<{ accessToken: string; refreshToken: string }> {
  const data = await exchangeRefreshToken(refreshToken, organizationId);
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
  };
}

/**
 * Get an org-scoped access token using the stored refresh token.
 * Returns the access token and the updated credentials (with rotated refresh token).
 * Persists the updated credentials to disk.
 * If the refresh token is expired, automatically re-authenticates via browser.
 */
export async function getOrgScopedToken(
  organizationId: string,
): Promise<{ accessToken: string; credentials: Credentials }> {
  const creds = loadCredentials();
  if (!creds) {
    throw new Error('Not logged in. Run `charcoal login` first.');
  }

  if (!creds.refreshToken) {
    throw new Error(
      'This command requires browser authentication. Run `charcoal login` (without --api-key).'
    );
  }

  const data = await exchangeRefreshToken(creds.refreshToken, organizationId).catch(
    async () => {
      console.log('Session expired, re-authenticating...');
      const result = await performOAuthLogin();
      const refreshed = await exchangeRefreshToken(result.refreshToken, organizationId);
      creds.user = result.user;
      return refreshed;
    }
  );

  creds.refreshToken = data.refresh_token;
  saveCredentials(creds);

  return { accessToken: data.access_token, credentials: creds };
}

async function exchangeRefreshToken(
  refreshToken: string,
  organizationId: string,
): Promise<AuthenticateResponse> {
  const response = await fetch(
    `${WORKOS_BASE_URL}/user_management/authenticate`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        grant_type: 'refresh_token',
        client_id: WORKOS_CLIENT_ID,
        refresh_token: refreshToken,
        organization_id: organizationId,
      }),
    }
  );

  if (!response.ok) {
    throw new Error('Refresh token expired');
  }

  return (await response.json()) as AuthenticateResponse;
}
