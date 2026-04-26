import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SessionUser, defaultUsers } from "./erp-data";
import { findUserByUsername, getUserById, hasDatabase } from "./db";
import { createPasswordHash, signValue } from "./security";

const SESSION_COOKIE = "spring_foods_session";
export const SESSION_MAX_AGE = 60 * 15;

function signPayload(payload: string) {
  return signValue(payload);
}

export async function authenticateUser(username: string, password: string): Promise<SessionUser | null> {
  if (!hasDatabase()) {
    const fallback = defaultUsers.find((user) => user.username === username && user.password === password);
    return fallback
      ? { id: defaultUsers.indexOf(fallback) + 1, username: fallback.username, displayName: fallback.displayName, role: fallback.role }
      : null;
  }

  const user = await findUserByUsername(username);
  if (!user) {
    return null;
  }

  if (user.password_hash !== createPasswordHash(password)) {
    return null;
  }

  return {
    id: user.id,
    username: user.username,
    displayName: user.display_name,
    role: user.role
  };
}

export async function setSession(user: SessionUser) {
  const issuedAt = Date.now();
  const payload = `${user.id}.${issuedAt}`;
  const signature = signPayload(payload);
  const cookieStore = await cookies();

  cookieStore.set(SESSION_COOKIE, `${payload}.${signature}`, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE
  });
}

export async function clearSession() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

export async function getSessionUser() {
  const cookieStore = await cookies();
  const raw = cookieStore.get(SESSION_COOKIE)?.value;

  if (!raw) {
    return null;
  }

  const parts = raw.split(".");
  if (parts.length !== 3) {
    return null;
  }

  const [idPart, issuedAtPart, signature] = parts;
  const payload = `${idPart}.${issuedAtPart}`;

  if (signPayload(payload) !== signature) {
    return null;
  }

  const userId = Number(idPart);
  if (!Number.isFinite(userId)) {
    return null;
  }

  if (!hasDatabase()) {
    const fallback = defaultUsers[userId - 1];
    return fallback
      ? { id: userId, username: fallback.username, displayName: fallback.displayName, role: fallback.role }
      : null;
  }

  return getUserById(userId);
}

export async function requireSessionUser() {
  const user = await getSessionUser();
  if (!user) {
    redirect("/login");
  }
  return user;
}
