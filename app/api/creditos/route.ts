import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth } from '@/lib/middleware';
import { z } from 'zod';
import { calcularCuotas } from '@/lib/calculadora-creditos';

const creditoSchema = z.object({
  monto: z.number().positive(),
  plazoMeses: z.number().int().positive(),
  clienteId: z.string(),
  configuracionCreditoId: z.string(),
  fechaInicio: z.string().optional(),
});

// GET: Obtener todos los créditos
export const GET = withAuth(async (req: NextRequest, { user }: any) => {
  try {
    if (!user?.empresaActivaId) {
      return NextResponse.json(
        { error: 'No hay empresa activa' },
        { status: 400 }
      );
    }

    const creditos = await prisma.credito.findMany({
      where: {
        empresaId: user.empresaActivaId,
      },
      include: {
        cliente: true,
        pagos: true,
        configuracionCredito: true,
        cuotas: {
          orderBy: {
            numeroCuota: 'asc',
          },
        },
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
export const POST = withAuth(async (req: NextRequest, { user }: any) => {
  try {
    if (!user?.empresaActivaId) {
      return NextResponse.json(
        { error: 'No hay empresa activa' },
        { status: 400 }
      );
    }

    const body = await req.json();
    const { monto, plazoMeses, clienteId, configuracionCreditoId, fechaInicio } = creditoSchema.parse(body);

    // Obtener la configuración de crédito
    const configuracion = await prisma.configuracionCredito.findUnique({
      where: { id: configuracionCreditoId },
    });

    if (!configuracion) {
      return NextResponse.json(
        { error: 'Configuración de crédito no encontrada' },
        { status: 404 }
      );
    }

    // Calcular fecha de inicio
    const fechaInicioDate = fechaInicio ? new Date(fechaInicio) : new Date();
    
    // Calcular cuotas usando la calculadora
    const cuotasCalculadas = calcularCuotas(
      monto,
      configuracion.interesAnual,
      plazoMeses,
      fechaInicioDate,
      configuracion.tipoCalculo
    );

    // Calcular cuota mensual promedio y fecha de vencimiento
    const cuotaMensual = cuotasCalculadas[0].montoCuota;
    const fechaVencimiento = cuotasCalculadas[cuotasCalculadas.length - 1].fechaVencimiento;

    // Crear el crédito con sus cuotas
    const credito = await prisma.credito.create({
      data: {
        monto,
        tasaInteres: configuracion.interesAnual,
        plazoMeses,
        cuotaMensual,
        fechaInicio: fechaInicioDate,
        fechaVencimiento,
        clienteId,
        configuracionCreditoId,
        empresaId: user.empresaActivaId,
        cuotas: {
          create: cuotasCalculadas.map(cuota => ({
            numeroCuota: cuota.numeroCuota,
            fechaVencimiento: cuota.fechaVencimiento,
            montoCuota: cuota.montoCuota,
            capital: cuota.capital,
            interes: cuota.interes,
            balanceInicial: cuota.balanceInicial,
            balanceFinal: cuota.balanceFinal,
          })),
        },
      },
      include: {
        cliente: true,
        configuracionCredito: true,
        cuotas: {
          orderBy: {
            numeroCuota: 'asc',
          },
        },
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
