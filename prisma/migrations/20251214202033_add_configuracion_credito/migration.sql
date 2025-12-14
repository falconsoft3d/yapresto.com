-- CreateTable
CREATE TABLE "ConfiguracionCredito" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "interesAnual" DOUBLE PRECISION NOT NULL,
    "tipoCalculo" TEXT NOT NULL DEFAULT 'frances',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ConfiguracionCredito_pkey" PRIMARY KEY ("id")
);
