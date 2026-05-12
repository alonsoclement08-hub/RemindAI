-- AlterTable
ALTER TABLE "reminders" ADD COLUMN     "geo_notified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "location_lat" DOUBLE PRECISION,
ADD COLUMN     "location_lng" DOUBLE PRECISION,
ADD COLUMN     "location_name" TEXT,
ADD COLUMN     "location_radius" INTEGER NOT NULL DEFAULT 500,
ADD COLUMN     "use_geolocation" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "reminders_use_geolocation_geo_notified_idx" ON "reminders"("use_geolocation", "geo_notified");
