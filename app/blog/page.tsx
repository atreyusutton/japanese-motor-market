import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { SiteContainer } from "@/components/layout/site-container"

export const dynamic = "force-dynamic"

export default async function BlogIndexPage() {
  const posts = await prisma.blogPost
    .findMany({
      where: { publishedAt: { not: null } },
      orderBy: { publishedAt: "desc" },
    })
    .catch(() => [])

  return (
    <div className="bg-page py-12 md:py-16">
      <SiteContainer className="space-y-10">
        <div className="border-b-2 border-jmm-black pb-6">
          <div className="flex items-center gap-3">
            <span className="kanji text-jmm-red text-3xl leading-none">旧車</span>
            <p className="text-xs uppercase tracking-[0.32em] text-text-muted">JDM Blog</p>
          </div>
          <h1 className="mt-2 font-display text-4xl sm:text-5xl uppercase tracking-[0.02em] text-jmm-black">
            News & culture
          </h1>
          <p className="mt-2 text-sm text-text-muted max-w-2xl">
            JDM news, auctions, imports, drift culture, and shop builds — automatically updated by an AI editorial pipeline.
          </p>
        </div>

        {posts.length === 0 ? (
          <div className="border border-jmm-black/15 bg-card p-10 text-center">
            <p className="font-display text-xl uppercase tracking-[0.04em] text-jmm-black">
              The first stories are being written.
            </p>
            <p className="mt-2 text-sm text-text-muted">
              The blog is wired up but empty. AI-generated posts will start landing here soon.
            </p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {posts.map((post) => (
              <Link
                key={post.id}
                href={`/blog/${post.slug}`}
                className="group flex flex-col h-full bg-card border border-jmm-black/15 hover:border-jmm-red transition-colors"
              >
                <div className="p-5 space-y-3 flex-1 flex flex-col">
                  <p className="text-[0.65rem] uppercase tracking-[0.18em] text-jmm-red font-semibold">
                    {post.aiGenerated ? "AI Editorial" : "Editorial"}
                  </p>
                  <h2 className="font-display text-2xl uppercase tracking-[0.02em] text-jmm-black group-hover:text-jmm-red transition-colors">
                    {post.title}
                  </h2>
                  {post.excerpt && (
                    <p className="text-sm text-text-muted line-clamp-3">{post.excerpt}</p>
                  )}
                  <div className="mt-auto pt-3 flex items-center justify-between text-xs text-text-muted border-t border-jmm-black/10">
                    <span>
                      {post.publishedAt
                        ? new Date(post.publishedAt).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })
                        : ""}
                    </span>
                    <span className="uppercase tracking-[0.18em] text-jmm-red">Read →</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </SiteContainer>
    </div>
  )
}
