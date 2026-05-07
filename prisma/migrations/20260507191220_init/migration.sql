-- CreateEnum
CREATE TYPE "ListingStatus" AS ENUM ('active', 'draft', 'sold');

-- CreateEnum
CREATE TYPE "TitleStatus" AS ENUM ('clean', 'salvage', 'stolen', 'lien', 'flood');

-- CreateEnum
CREATE TYPE "MediaType" AS ENUM ('image', 'video');

-- CreateEnum
CREATE TYPE "MediaProvider" AS ENUM ('cloudflare_images', 'cloudflare_stream');

-- CreateEnum
CREATE TYPE "ConditionGrade" AS ENUM ('show_car', 'driver', 'it_runs', 'project');

-- CreateEnum
CREATE TYPE "AdPlacement" AS ENUM ('home', 'card', 'detail');

-- CreateTable
CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "publicId" TEXT,
    "clerkId" TEXT,
    "username" TEXT,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "phone" TEXT,
    "image" TEXT,
    "isAdmin" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "listings" (
    "id" SERIAL NOT NULL,
    "publicId" TEXT NOT NULL,
    "sellerId" INTEGER NOT NULL,
    "listingStatus" "ListingStatus" NOT NULL DEFAULT 'draft',
    "publishedAt" TIMESTAMP(3),
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "year" INTEGER,
    "make" TEXT,
    "model" TEXT,
    "vehicleIdentifier" TEXT,
    "mileage" INTEGER,
    "location" TEXT,
    "engine" TEXT,
    "transmission" TEXT,
    "exteriorColor" TEXT,
    "interiorColorMaterial" TEXT,
    "askingPrice" INTEGER,
    "optionsAndFeatures" TEXT,
    "modifications" TEXT,
    "conditionGrade" "ConditionGrade",
    "vehicleHistory" TEXT,
    "maintenanceHistory" TEXT,
    "titleStatus" "TitleStatus",
    "carfaxAvailable" BOOLEAN,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "listings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "listing_media" (
    "id" SERIAL NOT NULL,
    "listingId" INTEGER NOT NULL,
    "type" "MediaType" NOT NULL,
    "provider" "MediaProvider" NOT NULL,
    "providerId" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL,
    "isCover" BOOLEAN NOT NULL DEFAULT false,
    "altText" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "listing_media_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "saved_listings" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "listingId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "saved_listings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ads" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "placement" "AdPlacement" NOT NULL,
    "url" TEXT NOT NULL,
    "desktopImageId" TEXT NOT NULL,
    "mobileImageId" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "events" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "shortTitle" TEXT,
    "date" TIMESTAMP(3) NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "blog_posts" (
    "id" SERIAL NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "excerpt" TEXT,
    "body" TEXT NOT NULL,
    "coverImageId" TEXT,
    "authorName" TEXT,
    "publishedAt" TIMESTAMP(3),
    "aiGenerated" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "blog_posts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_publicId_key" ON "users"("publicId");

-- CreateIndex
CREATE UNIQUE INDEX "users_clerkId_key" ON "users"("clerkId");

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "listings_publicId_key" ON "listings"("publicId");

-- CreateIndex
CREATE INDEX "ads_placement_active_idx" ON "ads"("placement", "active");

-- CreateIndex
CREATE INDEX "events_active_date_idx" ON "events"("active", "date");

-- CreateIndex
CREATE UNIQUE INDEX "blog_posts_slug_key" ON "blog_posts"("slug");

-- CreateIndex
CREATE INDEX "blog_posts_publishedAt_idx" ON "blog_posts"("publishedAt");

-- AddForeignKey
ALTER TABLE "listings" ADD CONSTRAINT "listings_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "listing_media" ADD CONSTRAINT "listing_media_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "saved_listings" ADD CONSTRAINT "saved_listings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "saved_listings" ADD CONSTRAINT "saved_listings_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
