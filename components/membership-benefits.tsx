"use client"

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"

const benefits = [
  {
    title: "Free to list. Free to join.",
    description:
      "No listing fees. No membership fees. No commissions. Buy and sell JDM and Japanese vehicles without the marketplace tax.",
  },
  {
    title: "Built for the JDM community",
    description:
      "A focused marketplace for kei trucks, R32s, JZA80s, AE86s, FDs, NSXs, RX-7s, Hakosukas, Skyline GT-Rs, and everything in between. No tire-kickers — just enthusiasts who get it.",
  },
  {
    title: "Member-to-member sales",
    description:
      "Talk directly to the seller. Inspect on your schedule. No auction pressure, no shill bidding — just real people moving real cars.",
  },
  {
    title: "Create high-quality listings fast",
    description:
      "A guided listing flow that captures the details buyers actually care about: condition, history, modifications, mileage, options, photos.",
  },
  {
    title: "JDM news & culture",
    description:
      "Stay current on auctions, regs, imports, drift events, and shop builds with our blog — automatically updated with what matters in the JDM world.",
  },
  {
    title: "Built by enthusiasts",
    description:
      "Japanese Motor Market is run by people who own, drive, and wrench on these cars. We built the platform we wished existed.",
  },
]

export function MembershipBenefits() {
  return (
    <Accordion type="single" collapsible className="w-full">
      {benefits.map((benefit) => (
        <AccordionItem
          key={benefit.title}
          value={benefit.title}
          className="border-b border-jmm-black/15"
        >
          <AccordionTrigger className="py-5 text-base sm:text-lg font-display font-semibold uppercase tracking-[0.04em] text-jmm-black hover:no-underline hover:text-jmm-red">
            {benefit.title}
          </AccordionTrigger>
          <AccordionContent className="text-sm sm:text-base leading-relaxed text-jmm-black/80">
            {benefit.description}
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  )
}
