import { auth as clerkAuth, currentUser } from "@clerk/nextjs/server"
import { prisma } from "./prisma"
import type { User } from "@prisma/client"

export type SessionUser = {
  id: string
  dbId: number
  email: string
  name: string | null
  image: string | null
  username: string | null
  isAdmin: boolean
}

export type Session = { user: SessionUser } | null

/**
 * Drop-in replacement for the old NextAuth `auth()` server helper.
 * Resolves the current Clerk user and JIT-creates / links a User row.
 * If the email matches an existing seeded User without a clerkId, that
 * row is adopted (so seed-time accounts get linked on first sign-in).
 */
export async function auth(): Promise<Session> {
  const { userId: clerkUserId } = await clerkAuth()
  if (!clerkUserId) return null

  let user: User | null = await prisma.user.findUnique({ where: { clerkId: clerkUserId } })

  if (!user) {
    const cu = await currentUser()
    if (!cu) return null
    const email = cu.primaryEmailAddress?.emailAddress ?? cu.emailAddresses[0]?.emailAddress
    if (!email) return null

    const fullName = [cu.firstName, cu.lastName].filter(Boolean).join(" ") || null
    const image = cu.imageUrl || null
    const username = cu.username || null

    const existingByEmail = await prisma.user.findUnique({ where: { email } })
    if (existingByEmail && !existingByEmail.clerkId) {
      user = await prisma.user.update({
        where: { id: existingByEmail.id },
        data: {
          clerkId: clerkUserId,
          name: existingByEmail.name ?? fullName,
          image: existingByEmail.image ?? image,
          username: existingByEmail.username ?? username,
        },
      })
    } else {
      user = await prisma.user.create({
        data: { clerkId: clerkUserId, email, name: fullName, image, username },
      })
    }
  }

  return {
    user: {
      id: String(user.id),
      dbId: user.id,
      email: user.email,
      name: user.name,
      image: user.image,
      username: user.username,
      isAdmin: user.isAdmin,
    },
  }
}

/** Require a logged-in user (server) — returns the Session, never null. */
export async function requireAuth(): Promise<NonNullable<Session>> {
  const session = await auth()
  if (!session) throw new Error("Unauthorized")
  return session
}

/** Require admin privileges (server). */
export async function requireAdmin(): Promise<NonNullable<Session>> {
  const session = await requireAuth()
  if (!session.user.isAdmin) throw new Error("Forbidden")
  return session
}
