import bcrypt from "bcryptjs"
import { SignJWT, jwtVerify } from "jose"
import { cookies } from "next/headers"

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "your-secret-key-change-in-production")

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10)
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  try {
    if (!password || typeof hashedPassword !== "string") return false
    // Basic guard: bcrypt hashes start with $2 prefix
    if (!hashedPassword.startsWith("$2")) return false
    return await bcrypt.compare(password, hashedPassword)
  } catch (_error) {
    // Treat compare errors as invalid credentials rather than 500
    return false
  }
}

export async function createToken(userId: string, role: string): Promise<string> {
  return new SignJWT({ userId, role }).setProtectedHeader({ alg: "HS256" }).setExpirationTime("7d").sign(JWT_SECRET)
}

export async function verifyToken(token: string) {
  try {
    const verified = await jwtVerify(token, JWT_SECRET)
    return verified.payload as { userId: string; role: string }
  } catch (error) {
    return null
  }
}

export async function getSession() {
  const cookieStore = await cookies()
  const token = cookieStore.get("auth-token")

  if (!token) return null

  return verifyToken(token.value)
}

export async function requireAdmin() {
  const session = await getSession()

  if (!session || session.role !== "admin") {
    throw new Error("Unauthorized: Admin access required")
  }

  return session
}
