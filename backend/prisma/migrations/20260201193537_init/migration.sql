/*
  Warnings:

  - Made the column `address` on table `properties` required. This step will fail if there are existing NULL values in that column.
  - Made the column `latitude` on table `properties` required. This step will fail if there are existing NULL values in that column.
  - Made the column `longitude` on table `properties` required. This step will fail if there are existing NULL values in that column.
  - Made the column `privacy_radius` on table `properties` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "properties" ADD COLUMN     "privacy_circle_center_lat" DOUBLE PRECISION,
ADD COLUMN     "privacy_circle_center_lon" DOUBLE PRECISION,
ALTER COLUMN "address" SET NOT NULL,
ALTER COLUMN "latitude" SET NOT NULL,
ALTER COLUMN "longitude" SET NOT NULL,
ALTER COLUMN "privacy_radius" SET NOT NULL,
ALTER COLUMN "privacy_radius" SET DEFAULT 500;
