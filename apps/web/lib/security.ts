import crypto from "crypto";

function getSecret() {
  return process.env.AUTH_SECRET || "change-me-in-railway";
}

export function createPasswordHash(password: string) {
  return crypto.createHash("sha256").update(`${password}:${getSecret()}`).digest("hex");
}

export function signValue(value: string) {
  return crypto.createHmac("sha256", getSecret()).update(value).digest("hex");
}
