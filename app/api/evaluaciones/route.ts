import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth } from '@/lib/middleware';
import { z } from 'zod';

const evaluacionSchema = z.object({
  clienteId: z.string(),
  ingresosMensuales: z.number().positive(),
  gastosMensuales: z.number().min(0),
  porcentajeEndeudamiento: z.number().min(0).max(100).default(40),
});

// GET: Obtener todas las evaluaciones
export const GET = withAuth(async (req: NextRequest, { user }: any) => {
  try {
    if (!user?.empresaActivaId) {
      return NextResponse.json(
        { error: 'No hay empresa activa' },
        { status: 400 }
      );
    }

    const { searchParams } = new URL(req.url);
    const clienteId = searchParams.get('clienteId');

    if (clienteId) {
      // Obtener evaluaciones de un cliente específico (verificando que pertenezca a la empresa)
      const evaluaciones = await prisma.evaluacion.findMany({
        where: { 
          clienteId,
          cliente: {
            empresaId: user.empresaActivaId,
          },
        },
        include: {
          cliente: true,
        },
        orderBy: { createdAt: 'desc' },
      });
      return NextResponse.json(evaluaciones);
    }

    // Obtener todas las evaluaciones de la empresa
    const evaluaciones = await prisma.evaluacion.findMany({
      where: {
        cliente: {
          empresaId: user.empresaActivaId,
        },
      },
      include: {
        cliente: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(evaluaciones);
  } catch (error) {
    console.error('Error al obtener evaluaciones:', error);
    return NextResponse.json(
      { error: 'Error al obtener evaluaciones' },
      { status: 500 }
    );
  }
});

// POST: Crear una nueva evaluación
export const POST = withAuth(async (req: NextRequest) => {
  try {
    const body = await req.json();
    const { clienteId, ingresosMensuales, gastosMensuales, porcentajeEndeudamiento } = evaluacionSchema.parse(body);

    // Validar que el cliente existe
    const cliente = await prisma.cliente.findUnique({
      where: { id: clienteId },
    });

    if (!cliente) {
      return NextResponse.json(
        { error: 'Cliente no encontrado' },
        { status: 404 }
      );
    }

    // Validar que los gastos no sean mayores que los ingresos
    if (gastosMensuales > ingresosMensuales) {
      return NextResponse.json(
        { error: 'Los gastos no pueden ser mayores que los ingresos' },
        { status: 400 }
      );
    }

    // Calcular capacidad de endeudamiento
    const ingresoDisponible = ingresosMensuales - gastosMensuales;
    const capacidadEndeudamiento = ingresoDisponible * (porcentajeEndeudamiento / 100);

    const evaluacion = await prisma.evaluacion.create({
      data: {
        clienteId,
        ingresosMensuales,
        gastosMensuales,
        capacidadEndeudamiento,
        porcentajeEndeudamiento,
      },
      include: {
        cliente: true,
      },
    });

    return NextResponse.json(evaluacion, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      );
    }
    console.error('Error creando evaluación:', error);
    return NextResponse.json(
      { error: 'Error al crear evaluación' },
      { status: 500 }
    );
  }
});
