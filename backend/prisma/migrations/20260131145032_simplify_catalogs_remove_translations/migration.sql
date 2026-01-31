/*
  Warnings:

  - You are about to drop the column `label` on the `energy_labels` table. All the data in the column will be lost.
  - You are about to drop the column `label_ca` on the `orientations` table. All the data in the column will be lost.
  - You are about to drop the column `label_en` on the `orientations` table. All the data in the column will be lost.
  - You are about to drop the column `label_es` on the `orientations` table. All the data in the column will be lost.
  - You are about to drop the column `label_ca` on the `property_conditions` table. All the data in the column will be lost.
  - You are about to drop the column `label_en` on the `property_conditions` table. All the data in the column will be lost.
  - You are about to drop the column `label_es` on the `property_conditions` table. All the data in the column will be lost.
  - You are about to drop the column `label_ca` on the `property_types` table. All the data in the column will be lost.
  - You are about to drop the column `label_en` on the `property_types` table. All the data in the column will be lost.
  - You are about to drop the column `label_es` on the `property_types` table. All the data in the column will be lost.
  - You are about to drop the `municipalities` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `provinces` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "municipalities" DROP CONSTRAINT "municipalities_province_code_fkey";

-- AlterTable
ALTER TABLE "energy_labels" DROP COLUMN "label";

-- AlterTable
ALTER TABLE "orientations" DROP COLUMN "label_ca",
DROP COLUMN "label_en",
DROP COLUMN "label_es";

-- AlterTable
ALTER TABLE "property_conditions" DROP COLUMN "label_ca",
DROP COLUMN "label_en",
DROP COLUMN "label_es";

-- AlterTable
ALTER TABLE "property_types" DROP COLUMN "label_ca",
DROP COLUMN "label_en",
DROP COLUMN "label_es";

-- DropTable
DROP TABLE "municipalities";

-- DropTable
DROP TABLE "provinces";
