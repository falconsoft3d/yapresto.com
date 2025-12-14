import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth } from '@/lib/middleware';
import { z } from 'zod';

const pagoSchema = z.object({
  monto: z.number().positive(),
  metodoPago: z.enum(['efectivo', 'transferencia', 'tarjeta']),
});

// POST: Registrar un pago
export const POST = withAuth(async (req: NextRequest, { params }: { params: { id: string } }) => {
  try {
    const body = await req.json();
    const { monto, metodoPago } = pagoSchema.parse(body);

    // Obtener crédito
    const credito = await prisma.credito.findUnique({
      where: { id: params.id },
    });

    if (!credito) {
      return NextResponse.json(
        { error: 'Crédito no encontrado' },
        { status: 404 }
      );
    }

    // Crear pago
    const pago = await prisma.pago.create({
      data: {
        monto,
        metodoPago,
        creditoId: params.id,
      },
    });

    // Actualizar monto pagado del crédito
    const nuevoMontoPagado = credito.montoPagado + monto;
    const montoTotal = credito.cuotaMensual * credito.plazoMeses;
    const nuevoEstado = nuevoMontoPagado >= montoTotal ? 'pagado' : 'activo';

    await prisma.credito.update({
      where: { id: params.id },
      data: {
        montoPagado: nuevoMontoPagado,
        estado: nuevoEstado,
      },
    });

    return NextResponse.json(pago, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Error al registrar pago' },
      { status: 500 }
    );
  }
});
