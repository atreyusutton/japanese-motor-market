"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { MoreHorizontal } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { updateListingStatus, deleteListing } from "@/app/actions/listing"
import { useState } from "react"

interface ListingActionsProps {
  listingId: number
  status: "active" | "sold" | "draft"
}

export function ListingActions({ listingId, status }: ListingActionsProps) {
  const [isPending, setIsPending] = useState(false)

  const onUpdateStatus = async (newStatus: "active" | "sold" | "draft") => {
    setIsPending(true)
    try {
      await updateListingStatus(listingId, newStatus)
    } finally {
      setIsPending(false)
    }
  }

  const onDelete = async () => {
    if (confirm("Are you sure? This will delete the listing and images permanently.")) {
      setIsPending(true)
      try {
        await deleteListing(listingId)
      } finally {
        setIsPending(false)
      }
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" disabled={isPending}>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-56 bg-white text-foreground border border-border shadow-lg"
      >
        <DropdownMenuItem asChild>
          <Link href={`/sell/${listingId}`}>Edit Listing</Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        {status !== "active" && (
          <DropdownMenuItem onClick={() => onUpdateStatus("active")}>
            Mark Active
          </DropdownMenuItem>
        )}
        {status !== "sold" && (
          <DropdownMenuItem onClick={() => onUpdateStatus("sold")}>
            Mark Sold
          </DropdownMenuItem>
        )}
        {status !== "draft" && (
          <DropdownMenuItem onClick={() => onUpdateStatus("draft")}>
            Move to Draft
          </DropdownMenuItem>
        )}
        <DropdownMenuItem
          onClick={onDelete}
          className="text-jmm-red focus:text-jmm-red focus:bg-jmm-red/5"
        >
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
