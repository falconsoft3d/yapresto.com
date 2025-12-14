/*
  Warnings:

  - A unique constraint covering the columns `[tokenPublico]` on the table `Credito` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Credito" ADD COLUMN     "estadoAprobacion" TEXT,
ADD COLUMN     "fechaRespuesta" TIMESTAMP(3),
ADD COLUMN     "tokenPublico" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Credito_tokenPublico_key" ON "Credito"("tokenPublico");
