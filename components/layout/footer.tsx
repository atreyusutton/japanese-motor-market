import Link from "next/link"
import Image from "next/image"
import { SiteContainer } from "./site-container"

const footerLinks = [
  {
    title: "Marketplace",
    items: [
      { label: "Browse Vehicles", href: "/listings" },
      { label: "List Your Vehicle", href: "/sell" },
      { label: "Sign Up — Free", href: "/sign-up" },
    ],
  },
  {
    title: "Read",
    items: [
      { label: "JDM Blog", href: "/blog" },
      { label: "FAQ", href: "/faq" },
      { label: "Contact", href: "/contact" },
    ],
  },
  {
    title: "Legal",
    items: [
      { label: "Terms", href: "/terms" },
      { label: "Privacy", href: "/privacy" },
    ],
  },
]

export function Footer() {
  return (
    <footer className="bg-jmm-black text-text-inverse border-t-2 border-jmm-red">
      <SiteContainer className="py-12">
        <div className="grid gap-10 lg:grid-cols-[2fr_1fr_1fr_1fr]">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="relative h-12 w-12 border border-white/20">
                <Image
                  src="/assets/jmm-minimal-logo.png"
                  alt="Japanese Motor Market"
                  fill
                  className="object-contain p-1"
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="kanji text-jmm-red text-2xl leading-none">旧車</span>
                <span className="font-display text-lg font-semibold uppercase tracking-[0.12em]">
                  Japanese Motor Market
                </span>
              </div>
            </div>
            <p className="text-sm text-text-inverse/70 max-w-md leading-relaxed">
              A free, enthusiast-driven marketplace for JDM and Japanese-made vehicles in the United States.
              Built by people who love the cars.
            </p>
          </div>
          {footerLinks.map((group) => (
            <div key={group.title}>
              <p className="font-display text-xs uppercase tracking-[0.22em] text-jmm-red font-bold">
                {group.title}
              </p>
              <ul className="mt-4 space-y-2 text-sm tracking-[0.04em] text-text-inverse/70">
                {group.items.map((item) => (
                  <li key={item.href}>
                    <Link href={item.href} className="hover:text-text-inverse transition-colors">
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-10 border-t border-text-inverse/20 pt-6 text-xs tracking-[0.1em] text-text-inverse/60">
          © {new Date().getFullYear()} Japanese Motor Market · 旧車
        </div>
      </SiteContainer>
    </footer>
  )
}
