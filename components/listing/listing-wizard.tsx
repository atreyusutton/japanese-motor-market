"use client"

import { useState, useTransition } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { listingSchema } from "@/lib/validations/listing"
import { z } from "zod"
import { createListing } from "@/app/actions/listing"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { ImageUpload } from "@/components/ui/image-upload"
import { cn, getCloudflareImageUrl } from "@/lib/utils"

type ListingFormValues = z.infer<typeof listingSchema>
type ListingIntent = "draft" | "publish"

const STEPS = [
  { id: 1, title: "Basic Info" },
  { id: 2, title: "Options & Features" },
  { id: 3, title: "Condition & History" },
  { id: 4, title: "Images" },
  { id: 5, title: "Review & Publish" },
]

const CONDITION_LABELS: Record<ListingFormValues["conditionGrade"], string> = {
  show_car: "Show car",
  driver: "Driver",
  it_runs: "It runs",
  project: "Project",
}

const STEP_VALIDATION_MAP: Record<number, (keyof ListingFormValues)[]> = {
  1: [
    "year",
    "make",
    "model",
    "vehicleIdentifier",
    "location",
    "mileage",
    "exteriorColor",
    "interiorColorMaterial",
    "askingPrice",
  ],
  2: [],
  3: ["conditionGrade", "vehicleHistory", "maintenanceHistory"],
  4: ["images"],
  5: [],
}

function buildDefaultValues(
  initialData?: Partial<ListingFormValues> & { id?: number }
): ListingFormValues {
  const base: ListingFormValues = {
    year: undefined as unknown as number,
    make: "",
    model: "",
    vehicleIdentifier: "",
    location: "",
    mileage: 0,
    exteriorColor: "",
    interiorColorMaterial: "",
    engine: "",
    transmission: "",
    askingPrice: 0,
    optionsAndFeatures: "",
    modifications: "",
    conditionGrade: "driver",
    vehicleHistory: "",
    maintenanceHistory: "",
    titleStatus: undefined,
    carfaxAvailable: false,
    images: [],
  }

  if (!initialData) return base

  return {
    ...base,
    year: typeof initialData.year === "number" ? initialData.year : base.year,
    make: initialData.make || "",
    model: initialData.model || "",
    vehicleIdentifier: initialData.vehicleIdentifier || "",
    location: initialData.location || "",
    mileage: typeof initialData.mileage === "number" ? initialData.mileage : 0,
    exteriorColor: initialData.exteriorColor || "",
    interiorColorMaterial: initialData.interiorColorMaterial || "",
    engine: initialData.engine || "",
    transmission: initialData.transmission || "",
    askingPrice: typeof initialData.askingPrice === "number" ? initialData.askingPrice : 0,
    optionsAndFeatures: initialData.optionsAndFeatures || "",
    modifications: initialData.modifications || "",
    conditionGrade: initialData.conditionGrade || "driver",
    vehicleHistory: initialData.vehicleHistory || "",
    maintenanceHistory: initialData.maintenanceHistory || "",
    titleStatus: initialData.titleStatus,
    carfaxAvailable: initialData.carfaxAvailable || false,
    images: initialData.images || [],
  }
}

const SAMPLE_DATA: ListingFormValues = {
  year: 1995,
  make: "Nissan",
  model: "Skyline GT-R V-Spec (R33)",
  vehicleIdentifier: "BCNR33-001234",
  location: "Los Angeles, CA",
  mileage: 78000,
  exteriorColor: "Midnight Purple II",
  interiorColorMaterial: "Black cloth Recaros",
  engine: "RB26DETT 2.6L Twin-Turbo Inline-6",
  transmission: "5-Speed Manual",
  askingPrice: 95000,
  optionsAndFeatures:
    "V-Spec package with active LSD, ATTESA E-TS Pro, BBS LM forged wheels, factory boost gauge, and OEM HKS exhaust. Right-hand drive Japanese-spec import. Federalized via Show & Display.",
  modifications:
    "Largely stock. HKS cat-back exhaust and a Greddy Profec B Spec II boost controller. All factory parts retained and included with the sale.",
  conditionGrade: "driver",
  vehicleHistory:
    "JDM-spec R33 imported from Japan in 2021 under Show & Display. Two private US owners since import. Always garage-kept; never driven in salt or snow.",
  maintenanceHistory:
    "Full timing belt, water pump, and tensioner service at 75k. Fresh fluids, OEM plugs, new clutch master/slave, and Bilstein dampers. All work documented.",
  titleStatus: "clean",
  carfaxAvailable: true,
  images: [],
}

export function ListingWizard({
  initialData,
}: {
  initialData?: ListingFormValues & { id?: number }
}) {
  const [currentStep, setCurrentStep] = useState(1)
  const [isPending, startTransition] = useTransition()
  const [formError, setFormError] = useState<string | null>(null)
  const router = useRouter()

  const form = useForm<ListingFormValues>({
    resolver: zodResolver(listingSchema) as never,
    mode: "onChange",
    defaultValues: buildDefaultValues(initialData),
  })

  const fillSampleData = () => {
    Object.entries(SAMPLE_DATA).forEach(([key, value]) => {
      form.setValue(key as keyof ListingFormValues, value as never)
    })
  }

  const handleStepChange = async (direction: "next" | "prev") => {
    if (direction === "prev") {
      setCurrentStep((p) => Math.max(1, p - 1))
      window.scrollTo(0, 0)
      return
    }
    const fields = STEP_VALIDATION_MAP[currentStep] ?? []
    const isValid = fields.length === 0 ? true : await form.trigger(fields)
    if (isValid) {
      setCurrentStep((p) => Math.min(STEPS.length, p + 1))
      window.scrollTo(0, 0)
    }
  }

  const normalizeImageId = (value: string) => {
    try {
      const url = new URL(value)
      if (url.hostname.includes("imagedelivery.net")) {
        const parts = url.pathname.split("/").filter(Boolean)
        if (parts.length >= 2) return parts[1]
      }
    } catch {
      /* not a URL */
    }
    return value
  }

  const handleAction = async (intent: ListingIntent) => {
    setFormError(null)
    const isValid = await form.trigger()
    if (!isValid) {
      setCurrentStep(1)
      return
    }

    startTransition(async () => {
      const values = form.getValues()
      const normalizedImages = (values.images || []).map(normalizeImageId)
      try {
        const result = await createListing(
          { ...values, images: normalizedImages, id: initialData?.id },
          intent
        )
        if (result?.error) {
          setFormError(result.error)
          return
        }
        const redirectPath = result?.redirectPath ?? "/account/listings"
        router.push(redirectPath)
      } catch {
        setFormError("Something went wrong while saving your listing.")
      }
    })
  }

  const images = form.watch("images") || []
  const askingPrice = form.watch("askingPrice") || 0

  return (
    <div className="max-w-3xl mx-auto py-6 sm:py-10 px-4 sm:px-6">
      {!initialData && process.env.NODE_ENV === "development" && (
        <div className="mb-4 border border-dashed border-jmm-red/30 bg-jmm-red/5 p-3 sm:p-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h3 className="text-xs sm:text-sm font-medium text-jmm-red uppercase tracking-[0.12em]">
                Dev Mode
              </h3>
              <p className="text-[0.7rem] sm:text-xs text-jmm-black/70">
                Auto-fill the form with a sample R33 GT-R to preview the flow
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={fillSampleData}
              className="border-jmm-red/40 bg-white hover:bg-jmm-red/5 w-full sm:w-auto"
            >
              Fill Sample Data
            </Button>
          </div>
        </div>
      )}

      <div className="mb-6 sm:mb-8">
        <div className="flex justify-between mb-2 gap-1 sm:gap-2">
          {STEPS.map((step) => (
            <div
              key={step.id}
              className={cn(
                "text-[0.65rem] sm:text-xs md:text-sm font-medium truncate uppercase tracking-[0.12em]",
                step.id <= currentStep ? "text-jmm-red" : "text-muted-foreground"
              )}
            >
              <span className="hidden sm:inline">{step.title}</span>
              <span className="sm:hidden">{step.id}</span>
            </div>
          ))}
        </div>
        <div className="h-1 w-full bg-jmm-black/10 overflow-hidden">
          <div
            className="h-full bg-jmm-red transition-all duration-300 ease-in-out"
            style={{ width: `${(currentStep / STEPS.length) * 100}%` }}
          />
        </div>
      </div>

      <Card className="border border-jmm-black/15">
        <CardHeader className="pb-4">
          <CardTitle className="font-display text-lg sm:text-xl uppercase tracking-[0.04em]">
            Step {currentStep}: {STEPS[currentStep - 1].title}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 sm:space-y-6">
          <Form {...form}>
            <form className="space-y-4 sm:space-y-6">
              {currentStep === 1 && (
                <div className="space-y-4">
                  <FormField control={form.control} name="year" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Year</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="1995"
                          className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          {...field}
                          onChange={(e) =>
                            field.onChange(e.target.value ? parseInt(e.target.value) : undefined)
                          }
                          value={field.value ?? ""}
                        />
                      </FormControl>
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="make" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Make</FormLabel>
                      <FormControl><Input placeholder="Nissan" {...field} /></FormControl>
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="model" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Model</FormLabel>
                      <FormControl><Input placeholder="Skyline GT-R" {...field} /></FormControl>
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="vehicleIdentifier" render={({ field }) => (
                    <FormItem>
                      <FormLabel>VIN / Chassis Code</FormLabel>
                      <FormControl><Input placeholder="BCNR33-..." {...field} /></FormControl>
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="location" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Location</FormLabel>
                      <FormControl><Input placeholder="Los Angeles, CA" {...field} /></FormControl>
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="mileage" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Mileage</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="50000"
                          className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          {...field}
                          onChange={(e) =>
                            field.onChange(e.target.value ? parseInt(e.target.value) : 0)
                          }
                          value={field.value || ""}
                        />
                      </FormControl>
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="askingPrice" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Asking Price (USD)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="55000"
                          className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          {...field}
                          onChange={(e) =>
                            field.onChange(e.target.value ? parseInt(e.target.value) : 0)
                          }
                          value={field.value || ""}
                        />
                      </FormControl>
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="engine" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Engine</FormLabel>
                      <FormControl><Input placeholder="RB26DETT 2.6L Twin-Turbo I6" {...field} /></FormControl>
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="transmission" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Transmission</FormLabel>
                      <FormControl><Input placeholder="5-Speed Manual" {...field} /></FormControl>
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="exteriorColor" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Exterior Color</FormLabel>
                      <FormControl><Input placeholder="Midnight Purple II" {...field} /></FormControl>
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="interiorColorMaterial" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Interior Color & Material</FormLabel>
                      <FormControl><Input placeholder="Black cloth Recaros" {...field} /></FormControl>
                    </FormItem>
                  )} />
                </div>
              )}

              {currentStep === 2 && (
                <div className="space-y-4">
                  <FormField control={form.control} name="optionsAndFeatures" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Options & Special Features</FormLabel>
                      <FormControl>
                        <Textarea rows={4} placeholder="V-Spec, BBS LM, factory boost gauge, etc." {...field} />
                      </FormControl>
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="modifications" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Is it stock? Any modifications?</FormLabel>
                      <FormControl>
                        <Textarea rows={4} placeholder="Detail any mods or confirm stock spec." {...field} />
                      </FormControl>
                    </FormItem>
                  )} />
                </div>
              )}

              {currentStep === 3 && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField control={form.control} name="conditionGrade" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Condition</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select condition" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="show_car">Show car</SelectItem>
                            <SelectItem value="driver">Driver</SelectItem>
                            <SelectItem value="it_runs">It runs</SelectItem>
                            <SelectItem value="project">Project</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="titleStatus" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Title Status (optional)</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="clean">Clean</SelectItem>
                            <SelectItem value="salvage">Salvage</SelectItem>
                            <SelectItem value="stolen">Stolen</SelectItem>
                            <SelectItem value="lien">Lien</SelectItem>
                            <SelectItem value="flood">Flood</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )} />
                  </div>
                  <FormField control={form.control} name="vehicleHistory" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Vehicle History</FormLabel>
                      <FormControl>
                        <Textarea rows={5} placeholder="Ownership story, import history, provenance..." {...field} />
                      </FormControl>
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="maintenanceHistory" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Maintenance & Restoration History</FormLabel>
                      <FormControl>
                        <Textarea rows={4} placeholder="Recent service, restoration work, known issues..." {...field} />
                      </FormControl>
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="carfaxAvailable" render={({ field }) => (
                    <FormItem className="flex items-center space-x-3 border border-jmm-black/15 p-4">
                      <FormControl>
                        <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Carfax available</FormLabel>
                      </div>
                    </FormItem>
                  )} />
                </div>
              )}

              {currentStep === 4 && (
                <div className="space-y-4">
                  <div>
                    <h3 className="font-display text-lg uppercase tracking-[0.04em]">Vehicle Photos</h3>
                    <p className="text-sm text-muted-foreground">
                      Upload up to 50 photos. Drag to reorder; the first image becomes the cover photo.
                    </p>
                  </div>
                  <FormField control={form.control} name="images" render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <ImageUpload value={field.value || []} onChange={field.onChange} maxFiles={50} />
                      </FormControl>
                    </FormItem>
                  )} />
                </div>
              )}

              {currentStep === 5 && (
                <div className="space-y-6">
                  {images.length > 0 && (
                    <div className="relative aspect-video w-full overflow-hidden border border-jmm-black/15 bg-muted">
                      <Image src={getCloudflareImageUrl(images[0])} alt="Hero" fill className="object-cover" />
                    </div>
                  )}

                  <div className="space-y-6">
                    <div className="border border-jmm-black/15 p-4">
                      <h3 className="font-display uppercase tracking-[0.12em] mb-3 border-b border-jmm-black/10 pb-2">
                        Basic Information
                      </h3>
                      <div className="grid grid-cols-2 gap-y-2 text-sm">
                        <span className="text-muted-foreground">Vehicle</span>
                        <span>
                          {form.getValues("year")} {form.getValues("make")} {form.getValues("model")}
                        </span>
                        <span className="text-muted-foreground">Location</span>
                        <span>{form.getValues("location") || "—"}</span>
                        <span className="text-muted-foreground">Mileage</span>
                        <span>{form.getValues("mileage")?.toLocaleString()} mi</span>
                        <span className="text-muted-foreground">Asking Price</span>
                        <span>${Number(askingPrice).toLocaleString()}</span>
                        <span className="text-muted-foreground">Identifier</span>
                        <span>{form.getValues("vehicleIdentifier")}</span>
                        <span className="text-muted-foreground">Engine</span>
                        <span>{form.getValues("engine") || "—"}</span>
                        <span className="text-muted-foreground">Transmission</span>
                        <span>{form.getValues("transmission") || "—"}</span>
                        <span className="text-muted-foreground">Colors</span>
                        <span>
                          {form.getValues("exteriorColor")} / {form.getValues("interiorColorMaterial")}
                        </span>
                      </div>
                    </div>

                    <div className="border border-jmm-black/15 p-4">
                      <h3 className="font-display uppercase tracking-[0.12em] mb-3 border-b border-jmm-black/10 pb-2">
                        Condition & Highlights
                      </h3>
                      <div className="space-y-3 text-sm">
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Condition</span>
                          <span className="font-semibold">
                            {CONDITION_LABELS[form.getValues("conditionGrade")]}
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground block text-xs mb-1">Options & Features</span>
                          <p className="line-clamp-3">
                            {form.getValues("optionsAndFeatures") || "No notes provided."}
                          </p>
                        </div>
                        <div>
                          <span className="text-muted-foreground block text-xs mb-1">Modifications</span>
                          <p className="line-clamp-3">
                            {form.getValues("modifications") || "No notes provided."}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="border border-jmm-black/15 p-4 space-y-4">
                    <div>
                      <h3 className="font-display uppercase tracking-[0.12em] text-sm mb-1">Vehicle History</h3>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                        {form.getValues("vehicleHistory")}
                      </p>
                    </div>
                    <div>
                      <h3 className="font-display uppercase tracking-[0.12em] text-sm mb-1">
                        Maintenance & Restoration
                      </h3>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                        {form.getValues("maintenanceHistory")}
                      </p>
                    </div>
                  </div>

                  {formError && (
                    <div className="border border-jmm-red/30 bg-jmm-red/5 px-4 py-2 text-sm text-jmm-red">
                      {formError}
                    </div>
                  )}
                </div>
              )}
            </form>
          </Form>
        </CardContent>
        <CardFooter className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pt-4 sm:pt-6">
          <div className="flex w-full gap-2 sm:w-auto">
            <Button
              variant="outline"
              onClick={() => handleStepChange("prev")}
              disabled={currentStep === 1 || isPending}
              className="flex-1 sm:flex-none h-11 sm:h-12"
            >
              Back
            </Button>
            {currentStep < STEPS.length && (
              <Button
                onClick={() => handleStepChange("next")}
                disabled={isPending}
                className="flex-1 sm:flex-none h-11 sm:h-12 bg-jmm-black text-white hover:bg-jmm-red"
              >
                Next Step
              </Button>
            )}
          </div>

          {currentStep === STEPS.length && (
            <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
              <Button
                variant="secondary"
                onClick={() => handleAction("draft")}
                disabled={isPending}
                className="h-11 sm:h-12"
              >
                {isPending ? "Saving..." : "Save Draft"}
              </Button>
              <Button
                onClick={() => handleAction("publish")}
                disabled={isPending}
                className="h-11 sm:h-12 bg-jmm-red text-white hover:bg-jmm-red-soft"
              >
                {isPending ? "Publishing..." : "Publish Listing"}
              </Button>
            </div>
          )}
        </CardFooter>
      </Card>
    </div>
  )
}
