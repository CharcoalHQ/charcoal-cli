import fs from 'node:fs';
import path from 'node:path';

import { CREDENTIALS_DIR, CREDENTIALS_FILE } from '../constants.js';

export interface OrgCredentials {
  apiKey: string;
  apiKeyPrefix?: string;
  apiKeySuffix?: string;
  organizationName: string;
}

export interface Credentials {
  user?: { id: string; email: string };
  refreshToken?: string;
  activeOrganizationId: string;
  organizations: Record<string, OrgCredentials>;
}

export function loadCredentials(): Credentials | null {
  try {
    const raw = fs.readFileSync(CREDENTIALS_FILE, 'utf-8');
    return JSON.parse(raw) as Credentials;
  } catch {
    return null;
  }
}

export function saveCredentials(creds: Credentials): void {
  fs.mkdirSync(CREDENTIALS_DIR, { recursive: true, mode: 0o700 });
  fs.chmodSync(CREDENTIALS_DIR, 0o700);
  const tmp = path.join(CREDENTIALS_DIR, `.credentials.tmp.${process.pid}`);
  fs.writeFileSync(tmp, JSON.stringify(creds, null, 2), { mode: 0o600 });
  fs.renameSync(tmp, CREDENTIALS_FILE);
}

export function clearCredentials(): void {
  try {
    fs.unlinkSync(CREDENTIALS_FILE);
  } catch {
    // Already gone.
  }
}

export function requireCredentials(): Credentials {
  const creds = loadCredentials();
  if (!creds) {
    throw new Error('Not logged in. Run `charcoal login` first.');
  }
  return creds;
}

export function getActiveOrg(creds: Credentials): OrgCredentials & { id: string } {
  const org = creds.organizations[creds.activeOrganizationId];
  if (!org) {
    throw new Error('No active organization. Run `charcoal login` or `charcoal org switch`.');
  }
  return { ...org, id: creds.activeOrganizationId };
}

export function getApiKey(): string {
  return getActiveOrg(requireCredentials()).apiKey;
}
