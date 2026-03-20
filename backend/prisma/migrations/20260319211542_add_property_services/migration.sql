-- CreateTable
CREATE TABLE "property_services" (
    "id" TEXT NOT NULL,
    "property_id" TEXT NOT NULL,
    "service_type" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "data" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "property_services_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "property_services_property_id_idx" ON "property_services"("property_id");

-- AddForeignKey
ALTER TABLE "property_services" ADD CONSTRAINT "property_services_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "properties"("id") ON DELETE CASCADE ON UPDATE CASCADE;
