import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth } from '@/lib/middleware';
import { z } from 'zod';

const creditoSchema = z.object({
  monto: z.number().positive(),
  tasaInteres: z.number().positive(),
  plazoMeses: z.number().int().positive(),
  clienteId: z.string(),
});

// GET: Obtener todos los créditos
export const GET = withAuth(async (req: NextRequest) => {
  try {
    const creditos = await prisma.credito.findMany({
      include: {
        cliente: true,
        pagos: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(creditos);
  } catch (error) {
    return NextResponse.json(
      { error: 'Error al obtener créditos' },
      { status: 500 }
    );
  }
});

// POST: Crear un nuevo crédito
export const POST = withAuth(async (req: NextRequest) => {
  try {
    const body = await req.json();
    const { monto, tasaInteres, plazoMeses, clienteId } = creditoSchema.parse(body);

    // Calcular cuota mensual (fórmula de amortización)
    const tasaMensual = tasaInteres / 100 / 12;
    const cuotaMensual = (monto * tasaMensual * Math.pow(1 + tasaMensual, plazoMeses)) / 
                         (Math.pow(1 + tasaMensual, plazoMeses) - 1);

    // Calcular fecha de vencimiento
    const fechaVencimiento = new Date();
    fechaVencimiento.setMonth(fechaVencimiento.getMonth() + plazoMeses);

    const credito = await prisma.credito.create({
      data: {
        monto,
        tasaInteres,
        plazoMeses,
        cuotaMensual,
        fechaVencimiento,
        clienteId,
      },
      include: {
        cliente: true,
      },
    });

    return NextResponse.json(credito, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Error al crear crédito' },
      { status: 500 }
    );
  }
});
