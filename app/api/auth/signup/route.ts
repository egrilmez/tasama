import { cookies } from "next/headers";
import {
  createSession,
  createUser,
  createWorkspace,
  getUserByEmail,
} from "@/lib/db";
import { hashPassword, SESSION_COOKIE, sessionCookieOptions } from "@/lib/auth";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const { name, email, password } = await req.json();
  if (!name?.trim() || !email?.includes("@") || !password || password.length < 6) {
    return Response.json(
      { error: "Name, valid email, and a password of 6+ characters are required." },
      { status: 400 }
    );
  }
  if (getUserByEmail(email)) {
    return Response.json(
      { error: "An account with this email already exists." },
      { status: 409 }
    );
  }
  const user = createUser(name.trim(), email, hashPassword(password));
  createWorkspace(user.id, name.trim(), "personal");
  const { token, expiresAt } = createSession(user.id);
  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, sessionCookieOptions(expiresAt));
  return Response.json({ ok: true });
}
