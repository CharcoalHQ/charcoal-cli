import { WORKOS_BASE_URL, WORKOS_CLIENT_ID } from '../constants.js';
import { type Credentials, loadCredentials, saveCredentials } from './credentials.js';
import { performOAuthLogin } from './oauth.js';

interface AuthenticateResponse {
  access_token: string;
  refresh_token: string;
  expires_in?: number;
  user: { id: string; email: string };
}

class RefreshTokenExpiredError extends Error {
  constructor() {
    super('Refresh token expired');
  }
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
  return refreshAndSave(organizationId);
}

/**
 * Get a user-scoped (no organization) access token using the stored refresh token.
 * Used by commands that need to operate across orgs (e.g. `org switch`, `org list`).
 */
export async function getUserScopedToken(): Promise<{
  accessToken: string;
  credentials: Credentials;
}> {
  return refreshAndSave(undefined);
}

async function refreshAndSave(
  organizationId: string | undefined,
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

  let data: AuthenticateResponse;
  try {
    data = await exchangeRefreshToken(creds.refreshToken, organizationId);
  } catch (err) {
    if (!(err instanceof RefreshTokenExpiredError)) {
      throw err;
    }
    console.log('Session expired, re-authenticating...');
    const result = await performOAuthLogin();
    data = await exchangeRefreshToken(result.refreshToken, organizationId);
    creds.user = result.user;
  }

  creds.refreshToken = data.refresh_token;
  saveCredentials(creds);

  return { accessToken: data.access_token, credentials: creds };
}

async function exchangeRefreshToken(
  refreshToken: string,
  organizationId: string | undefined,
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
        ...(organizationId && { organization_id: organizationId }),
      }),
    }
  );

  if (!response.ok) {
    const text = await response.text();
    let errorCode: string | undefined;
    try {
      errorCode = (JSON.parse(text) as { error?: string }).error;
    } catch {
      // Non-JSON body — fall through.
    }
    if (response.status === 401 || errorCode === 'invalid_grant') {
      throw new RefreshTokenExpiredError();
    }
    if (errorCode === 'organization_not_found') {
      throw new Error(
        `Active organization ${organizationId ?? '(unknown)'} was not found. ` +
          'It may have been deleted. Run `charcoal org switch` to pick another, ' +
          'or `charcoal login` to re-select.',
      );
    }
    throw new Error(
      `WorkOS refresh failed (${response.status}): ${text}`,
    );
  }

  return (await response.json()) as AuthenticateResponse;
}
