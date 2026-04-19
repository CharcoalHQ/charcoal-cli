import os from "node:os";

const rawEnv = process.env.CHARCOAL_ENV?.trim().toLowerCase() || "prod";
if (rawEnv !== "dev" && rawEnv !== "prod") {
  throw new Error(`Invalid CHARCOAL_ENV "${rawEnv}": must be "dev" or "prod".`);
}

export const CHARCOAL_ENV = rawEnv;

export const API_BASE_URL =
  CHARCOAL_ENV === "dev"
    ? "http://localhost:3000"
    : "https://api.withcharcoal.com";

export const WORKOS_CLIENT_ID =
  CHARCOAL_ENV === "dev"
    ? "client_01KKMT5J1EGSS2W5V5SC2C9ZZN"
    : "client_01KKMT5JMCT6958S74G9GE372Q";

export const WORKOS_BASE_URL = "https://api.workos.com";

export const OAUTH_REDIRECT_PORT = 9736;

export const CREDENTIALS_DIR = `${os.homedir()}/.charcoal`;

export const CREDENTIALS_FILE =
  CHARCOAL_ENV === "dev"
    ? `${CREDENTIALS_DIR}/credentials.dev.json`
    : `${CREDENTIALS_DIR}/credentials.json`;

export const CLI_KEY_NAME = `Charcoal CLI — ${os.hostname()}`;
