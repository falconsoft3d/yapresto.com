-- CreateTable
CREATE TABLE "Evaluacion" (
    "id" TEXT NOT NULL,
    "ingresosMensuales" DOUBLE PRECISION NOT NULL,
    "gastosMensuales" DOUBLE PRECISION NOT NULL,
    "capacidadEndeudamiento" DOUBLE PRECISION NOT NULL,
    "porcentajeEndeudamiento" DOUBLE PRECISION NOT NULL DEFAULT 40,
    "clienteId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Evaluacion_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Evaluacion" ADD CONSTRAINT "Evaluacion_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente"("id") ON DELETE CASCADE ON UPDATE CASCADE;
