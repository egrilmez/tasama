import { cookies } from "next/headers";
import { createSession, getUserByEmail } from "@/lib/db";
import { SESSION_COOKIE, sessionCookieOptions, verifyPassword } from "@/lib/auth";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const { email, password } = await req.json();
  const user = email ? getUserByEmail(email) : undefined;
  if (!user || !password || !verifyPassword(password, user.password_hash)) {
    return Response.json({ error: "Invalid email or password." }, { status: 401 });
  }
  const { token, expiresAt } = createSession(user.id);
  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, sessionCookieOptions(expiresAt));
  return Response.json({ ok: true });
}
