import os from "node:os";

export const API_BASE_URL =
  process.env.CHARCOAL_API_URL ?? "https://api.withcharcoal.com";

export const WORKOS_CLIENT_ID =
  process.env.CHARCOAL_WORKOS_CLIENT_ID ?? "client_01KKMT5JMCT6958S74G9GE372Q";

export const WORKOS_BASE_URL = "https://api.workos.com";

export const OAUTH_REDIRECT_PORT = 9736;

export const CREDENTIALS_DIR = `${os.homedir()}/.charcoal`;

export const CREDENTIALS_FILE = `${CREDENTIALS_DIR}/credentials.json`;

export const CLI_KEY_NAME = `Charcoal CLI — ${os.hostname()}`;
