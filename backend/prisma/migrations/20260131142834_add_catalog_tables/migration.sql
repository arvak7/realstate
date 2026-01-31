-- CreateTable
CREATE TABLE "property_types" (
    "id" TEXT NOT NULL,
    "code" VARCHAR(50) NOT NULL,
    "label_ca" VARCHAR(100) NOT NULL,
    "label_es" VARCHAR(100) NOT NULL,
    "label_en" VARCHAR(100) NOT NULL,
    "display_order" SMALLINT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "property_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "property_conditions" (
    "id" TEXT NOT NULL,
    "code" VARCHAR(50) NOT NULL,
    "label_ca" VARCHAR(100) NOT NULL,
    "label_es" VARCHAR(100) NOT NULL,
    "label_en" VARCHAR(100) NOT NULL,
    "display_order" SMALLINT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "property_conditions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "orientations" (
    "id" TEXT NOT NULL,
    "code" VARCHAR(50) NOT NULL,
    "label_ca" VARCHAR(100) NOT NULL,
    "label_es" VARCHAR(100) NOT NULL,
    "label_en" VARCHAR(100) NOT NULL,
    "display_order" SMALLINT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "orientations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "energy_labels" (
    "id" TEXT NOT NULL,
    "code" VARCHAR(20) NOT NULL,
    "label" VARCHAR(50) NOT NULL,
    "display_order" SMALLINT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "energy_labels_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "provinces" (
    "id" TEXT NOT NULL,
    "code" VARCHAR(50) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "autonomous_community" VARCHAR(100) NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "provinces_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "municipalities" (
    "id" TEXT NOT NULL,
    "code" VARCHAR(50) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "province_code" VARCHAR(50) NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "municipalities_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "property_types_code_key" ON "property_types"("code");

-- CreateIndex
CREATE INDEX "property_types_active_display_order_idx" ON "property_types"("active", "display_order");

-- CreateIndex
CREATE UNIQUE INDEX "property_conditions_code_key" ON "property_conditions"("code");

-- CreateIndex
CREATE INDEX "property_conditions_active_display_order_idx" ON "property_conditions"("active", "display_order");

-- CreateIndex
CREATE UNIQUE INDEX "orientations_code_key" ON "orientations"("code");

-- CreateIndex
CREATE INDEX "orientations_active_display_order_idx" ON "orientations"("active", "display_order");

-- CreateIndex
CREATE UNIQUE INDEX "energy_labels_code_key" ON "energy_labels"("code");

-- CreateIndex
CREATE INDEX "energy_labels_active_display_order_idx" ON "energy_labels"("active", "display_order");

-- CreateIndex
CREATE UNIQUE INDEX "provinces_code_key" ON "provinces"("code");

-- CreateIndex
CREATE INDEX "provinces_active_idx" ON "provinces"("active");

-- CreateIndex
CREATE UNIQUE INDEX "municipalities_code_key" ON "municipalities"("code");

-- CreateIndex
CREATE INDEX "municipalities_province_code_active_idx" ON "municipalities"("province_code", "active");

-- CreateIndex
CREATE INDEX "municipalities_active_idx" ON "municipalities"("active");

-- AddForeignKey
ALTER TABLE "municipalities" ADD CONSTRAINT "municipalities_province_code_fkey" FOREIGN KEY ("province_code") REFERENCES "provinces"("code") ON DELETE CASCADE ON UPDATE CASCADE;
