-- AlterTable
ALTER TABLE "User" ADD COLUMN     "empresaActivaId" TEXT;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_empresaActivaId_fkey" FOREIGN KEY ("empresaActivaId") REFERENCES "Empresa"("id") ON DELETE SET NULL ON UPDATE CASCADE;
