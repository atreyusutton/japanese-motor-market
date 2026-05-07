import { notFound } from "next/navigation"
import Image from "next/image"
import { prisma } from "@/lib/prisma"
import { SiteContainer } from "@/components/layout/site-container"
import { getCloudflareImageUrl } from "@/lib/utils"

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const post = await prisma.blogPost.findUnique({ where: { slug } })
  if (!post || !post.publishedAt) notFound()

  return (
    <article className="bg-page py-12 md:py-16">
      <SiteContainer className="max-w-3xl space-y-6">
        <div>
          <p className="text-[0.65rem] uppercase tracking-[0.32em] text-jmm-red font-semibold">
            {post.aiGenerated ? "AI Editorial" : "Editorial"}
          </p>
          <h1 className="mt-2 font-display text-4xl sm:text-5xl uppercase tracking-[0.02em] text-jmm-black">
            {post.title}
          </h1>
          <div className="mt-3 flex items-center gap-3 text-xs text-text-muted">
            {post.authorName && <span>By {post.authorName}</span>}
            <span>·</span>
            <time dateTime={post.publishedAt.toISOString()}>
              {post.publishedAt.toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </time>
          </div>
        </div>

        {post.coverImageId && (
          <div className="relative aspect-[16/9] w-full overflow-hidden border border-jmm-black/15 bg-muted">
            <Image
              src={getCloudflareImageUrl(post.coverImageId)}
              alt={post.title}
              fill
              className="object-cover"
              priority
            />
          </div>
        )}

        <div className="prose prose-neutral max-w-none">
          {post.body.split("\n\n").map((para, i) => (
            <p key={i} className="text-base leading-relaxed text-jmm-black/85 whitespace-pre-wrap">
              {para}
            </p>
          ))}
        </div>
      </SiteContainer>
    </article>
  )
}
