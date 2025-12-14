/*
  Warnings:

  - Added the required column `empresaId` to the `Cliente` table without a default value. This is not possible if the table is not empty.
  - Added the required column `empresaId` to the `Credito` table without a default value. This is not possible if the table is not empty.

*/

-- Obtener la primera empresa disponible para usarla como valor por defecto
DO $$ 
DECLARE
  default_empresa_id TEXT;
BEGIN
  SELECT id INTO default_empresa_id FROM "Empresa" LIMIT 1;
  
  -- AlterTable Cliente - agregar columna con valor temporal
  ALTER TABLE "Cliente" ADD COLUMN "empresaId" TEXT;
  UPDATE "Cliente" SET "empresaId" = default_empresa_id WHERE "empresaId" IS NULL;
  ALTER TABLE "Cliente" ALTER COLUMN "empresaId" SET NOT NULL;
  
  -- AlterTable Credito - agregar columna con valor temporal
  ALTER TABLE "Credito" ADD COLUMN "empresaId" TEXT;
  UPDATE "Credito" SET "empresaId" = default_empresa_id WHERE "empresaId" IS NULL;
  ALTER TABLE "Credito" ALTER COLUMN "empresaId" SET NOT NULL;
END $$;

-- CreateTable
CREATE TABLE "MedioPago" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MedioPago_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Cliente" ADD CONSTRAINT "Cliente_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Credito" ADD CONSTRAINT "Credito_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
