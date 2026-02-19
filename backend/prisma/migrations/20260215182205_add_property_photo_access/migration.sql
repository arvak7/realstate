-- AlterTable
ALTER TABLE "contacts" ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'pending';

-- CreateTable
CREATE TABLE "property_photo_access" (
    "id" TEXT NOT NULL,
    "property_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "granted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "property_photo_access_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "property_photo_access_property_id_idx" ON "property_photo_access"("property_id");

-- CreateIndex
CREATE INDEX "property_photo_access_user_id_idx" ON "property_photo_access"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "property_photo_access_property_id_user_id_key" ON "property_photo_access"("property_id", "user_id");

-- AddForeignKey
ALTER TABLE "property_photo_access" ADD CONSTRAINT "property_photo_access_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "properties"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "property_photo_access" ADD CONSTRAINT "property_photo_access_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
