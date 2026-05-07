import { SiteContainer } from "@/components/layout/site-container"

export const metadata = {
  title: "FAQ | Japanese Motor Market",
}

export default function FAQPage() {
  return (
    <SiteContainer className="py-12">
      <h1 className="font-display text-3xl sm:text-4xl font-bold text-jmm-black mb-8">
        Frequently Asked Questions
      </h1>
    </SiteContainer>
  )
}
