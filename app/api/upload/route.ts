import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"

export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const formData = await request.formData()
  const file = formData.get("file") as File | null
  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 })
  }

  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID
  const token = process.env.CLOUDFLARE_API_TOKEN
  if (!accountId || !token) {
    console.error("Missing Cloudflare credentials")
    return NextResponse.json({ error: "Server configuration error" }, { status: 500 })
  }

  if (file.type.startsWith("video/")) {
    return NextResponse.json(
      { error: "Video upload requires Cloudflare Stream — not configured" },
      { status: 501 }
    )
  }

  const cfFormData = new FormData()
  cfFormData.append("file", file)
  cfFormData.append(
    "metadata",
    JSON.stringify({ project: "jmm", uploaderId: String(session.user.dbId) })
  )

  try {
    const response = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${accountId}/images/v1`,
      { method: "POST", headers: { Authorization: `Bearer ${token}` }, body: cfFormData }
    )
    const data = await response.json()

    if (!data.success) {
      console.error("Cloudflare upload failed:", data.errors)
      return NextResponse.json({ error: "Upload failed" }, { status: 500 })
    }

    const imageId = data.result.id as string
    const variants = data.result.variants as string[]
    const publicUrl = variants.find((v) => v.endsWith("/public")) || variants[0]

    return NextResponse.json({ success: true, id: imageId, url: publicUrl })
  } catch (error) {
    console.error("Upload error:", error)
    return NextResponse.json({ error: "Upload failed" }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { url, id } = (await request.json()) as { url?: string; id?: string }

  let imageId = id
  if (!imageId && url) {
    const parts = url.split("/")
    imageId = parts[parts.length - 2]
  }
  if (!imageId) {
    return NextResponse.json({ error: "Invalid image reference" }, { status: 400 })
  }

  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID
  const token = process.env.CLOUDFLARE_API_TOKEN
  if (!accountId || !token) {
    return NextResponse.json({ error: "Server config error" }, { status: 500 })
  }

  try {
    const response = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${accountId}/images/v1/${imageId}`,
      { method: "DELETE", headers: { Authorization: `Bearer ${token}` } }
    )
    const data = await response.json()
    if (!data.success) {
      return NextResponse.json({ error: "Failed to delete image" }, { status: 500 })
    }
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Delete error:", error)
    return NextResponse.json({ error: "Delete failed" }, { status: 500 })
  }
}
