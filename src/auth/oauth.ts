import crypto from "node:crypto";
import http from "node:http";

import {
  OAUTH_REDIRECT_PORT,
  WORKOS_BASE_URL,
  WORKOS_CLIENT_ID,
} from "../constants.js";

function renderPage(title: string, subtitle: string, success: boolean): string {
  const icon = success ? `<div style="font-size:48px;margin-bottom:16px">&#10003;</div>` : '';
  const color = success ? '#1a1a1a' : '#c0392b';
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>${title}</title></head>
<body style="margin:0;display:flex;align-items:center;justify-content:center;min-height:100vh;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#fafafa">
  <div style="text-align:center;padding:40px">
    ${icon}
    <h1 style="margin:0 0 8px;font-size:24px;color:${color}">${title}</h1>
    <p style="margin:0;color:#666;font-size:16px">${subtitle}</p>
  </div>
</body>
</html>`;
}

function base64UrlEncode(buffer: Buffer): string {
  return buffer.toString("base64url");
}

function generatePkce(): { verifier: string; challenge: string } {
  const verifier = base64UrlEncode(crypto.randomBytes(32));
  const challenge = base64UrlEncode(
    crypto.createHash("sha256").update(verifier).digest(),
  );
  return { verifier, challenge };
}

interface OAuthResult {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: { id: string; email: string };
}

function getJwtExpiresIn(token: string): number | undefined {
  try {
    const payload = JSON.parse(
      Buffer.from(token.split(".")[1], "base64url").toString(),
    );
    if (typeof payload.exp === "number") {
      return payload.exp - Math.floor(Date.now() / 1000);
    }
  } catch {
    // Not a valid JWT — fall through.
  }
  return undefined;
}

export async function performOAuthLogin(
  organizationId?: string,
): Promise<OAuthResult> {
  const { verifier, challenge } = generatePkce();

  const { port, waitForCode, close } = await startCallbackServer();

  const params = new URLSearchParams({
    client_id: WORKOS_CLIENT_ID,
    redirect_uri: `http://localhost:${port}`,
    response_type: "code",
    code_challenge: challenge,
    code_challenge_method: "S256",
    provider: "authkit",
  });

  if (organizationId) {
    params.set("organization_id", organizationId);
  }

  const authUrl = `${WORKOS_BASE_URL}/user_management/authorize?${params}`;

  console.log("Opening browser for authentication...");
  const open = (await import("open")).default;
  await open(authUrl);
  console.log(`If the browser doesn't open, visit:\n${authUrl}\n`);

  let code: string;
  try {
    code = await waitForCode();
  } finally {
    close();
  }

  const tokenResponse = await fetch(
    `${WORKOS_BASE_URL}/user_management/authenticate`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        grant_type: "authorization_code",
        client_id: WORKOS_CLIENT_ID,
        code,
        code_verifier: verifier,
        redirect_uri: `http://localhost:${port}`,
      }),
    },
  );

  if (!tokenResponse.ok) {
    const text = await tokenResponse.text();
    throw new Error(`Authentication failed (${tokenResponse.status}): ${text}`);
  }

  const data = (await tokenResponse.json()) as {
    access_token: string;
    refresh_token: string;
    expires_in?: number;
    user: { id: string; email: string };
  };

  const expiresIn = data.expires_in ?? getJwtExpiresIn(data.access_token) ?? 3600;

  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresIn,
    user: data.user,
  };
}

function startCallbackServer(): Promise<{
  port: number;
  waitForCode: () => Promise<string>;
  close: () => void;
}> {
  return new Promise((resolve, reject) => {
    let resolveCode: (code: string) => void;
    let rejectCode: (err: Error) => void;

    const codePromise = new Promise<string>((res, rej) => {
      resolveCode = res;
      rejectCode = rej;
    });

    const server = http.createServer((req, res) => {
      const url = new URL(req.url ?? "/", `http://localhost`);
      const code = url.searchParams.get("code");
      const error = url.searchParams.get("error");

      if (error) {
        res.writeHead(400, { "Content-Type": "text/html" });
        res.end(renderPage("Authentication Failed", "Something went wrong. Please try again in the terminal.", false));
        rejectCode(new Error(`OAuth error: ${error}`));
        return;
      }

      if (code) {
        res.writeHead(200, { "Content-Type": "text/html" });
        res.end(renderPage("You're logged in!", "You can close this tab and return to the terminal.", true));
        resolveCode(code);
        return;
      }

      res.writeHead(400, { "Content-Type": "text/plain" });
      res.end("Missing code parameter");
    });

    server.listen(OAUTH_REDIRECT_PORT, "127.0.0.1", () => {
      const addr = server.address();
      const port =
        typeof addr === "object" && addr ? addr.port : OAUTH_REDIRECT_PORT;
      resolve({
        port,
        waitForCode: () => codePromise,
        close: () => server.close(),
      });
    });

    server.on("error", (err: NodeJS.ErrnoException) => {
      if (err.code === "EADDRINUSE") {
        // Fallback to random port.
        server.listen(0, "127.0.0.1", () => {
          const addr = server.address();
          const port = typeof addr === "object" && addr ? addr.port : 0;
          resolve({
            port,
            waitForCode: () => codePromise,
            close: () => server.close(),
          });
        });
      } else {
        reject(err);
      }
    });
  });
}
