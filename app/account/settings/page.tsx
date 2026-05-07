import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export default async function AccountSettingsPage() {
  const session = await auth()
  if (!session?.user) redirect("/sign-in")

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="font-display uppercase tracking-[0.04em]">Profile</CardTitle>
          <CardDescription>Your basic info as it appears on listings</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-text-muted">Username</p>
            <p className="font-display text-lg">
              {session.user.username ? `@${session.user.username}` : "—"}
            </p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-text-muted">Name</p>
            <p>{session.user.name || "—"}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-text-muted">Email</p>
            <p>{session.user.email}</p>
          </div>
          <p className="text-xs text-text-muted pt-2">
            Profile, password, and security settings are managed through Clerk.
          </p>
          <Button asChild variant="outline">
            <Link href="https://accounts.japanesemotormarket.com/user" target="_blank" rel="noreferrer">
              Manage account
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
