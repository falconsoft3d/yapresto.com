import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth } from '@/lib/middleware';
import { z } from 'zod';
import { calcularCuotas } from '@/lib/calculadora-creditos';

const creditoUpdateSchema = z.object({
  monto: z.number().positive().optional(),
  plazoMeses: z.number().int().positive().optional(),
  configuracionCreditoId: z.string().optional(),
  fechaInicio: z.string().optional(),
  estado: z.enum(['borrador', 'validado', 'activo', 'pagado', 'vencido']).optional(),
});

// GET: Obtener un crédito por ID
export const GET = withAuth(async (req: NextRequest, context: any) => {
  try {
    const { params, user } = context;
    
    if (!user?.empresaActivaId) {
      return NextResponse.json(
        { error: 'No hay empresa activa' },
        { status: 400 }
      );
    }

    const credito = await prisma.credito.findFirst({
      where: { 
        id: params.id,
        empresaId: user.empresaActivaId,
      },
      include: {
        cliente: true,
        configuracionCredito: true,
        pagos: {
          orderBy: {
            fechaPago: 'desc',
          },
        },
        cuotas: {
          orderBy: {
            numeroCuota: 'asc',
          },
        },
      },
    });

    if (!credito) {
      return NextResponse.json(
        { error: 'Crédito no encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json(credito);
  } catch (error) {
    return NextResponse.json(
      { error: 'Error al obtener crédito' },
      { status: 500 }
    );
  }
});

// PUT: Actualizar un crédito
export const PUT = withAuth(async (req: NextRequest, context: any) => {
  try {
    const { params, user } = context;
    
    if (!user?.empresaActivaId) {
      return NextResponse.json(
        { error: 'No hay empresa activa' },
        { status: 400 }
      );
    }

    const body = await req.json();
    const data = creditoUpdateSchema.parse(body);

    // Si se actualiza monto, plazo o configuración, recalcular cuotas
    if (data.monto || data.plazoMeses || data.configuracionCreditoId) {
      const creditoActual = await prisma.credito.findFirst({
        where: { 
          id: params.id,
          empresaId: user.empresaActivaId,
        },
        include: { configuracionCredito: true },
      });

      if (!creditoActual) {
        return NextResponse.json(
          { error: 'Crédito no encontrado' },
          { status: 404 }
        );
      }

      const monto = data.monto || creditoActual.monto;
      const plazoMeses = data.plazoMeses || creditoActual.plazoMeses;
      const configId = data.configuracionCreditoId || creditoActual.configuracionCreditoId;
      const fechaInicio = data.fechaInicio ? new Date(data.fechaInicio) : creditoActual.fechaInicio;

      // Obtener la configuración
      const configuracion = await prisma.configuracionCredito.findUnique({
        where: { id: configId },
      });

      if (!configuracion) {
        return NextResponse.json(
          { error: 'Configuración de crédito no encontrada' },
          { status: 404 }
        );
      }

      // Recalcular cuotas
      const cuotasCalculadas = calcularCuotas(
        monto,
        configuracion.interesAnual,
        plazoMeses,
        fechaInicio,
        configuracion.tipoCalculo
      );

      const cuotaMensual = cuotasCalculadas[0].montoCuota;
      const fechaVencimiento = cuotasCalculadas[cuotasCalculadas.length - 1].fechaVencimiento;

      // Eliminar cuotas antiguas y crear nuevas
      await prisma.cuota.deleteMany({
        where: { creditoId: params.id },
      });

      const credito = await prisma.credito.update({
        where: { id: params.id },
        data: {
          ...(data.monto && { monto: data.monto }),
          ...(data.plazoMeses && { plazoMeses: data.plazoMeses }),
          ...(data.configuracionCreditoId && { configuracionCreditoId: data.configuracionCreditoId }),
          ...(data.fechaInicio && { fechaInicio: new Date(data.fechaInicio) }),
          ...(data.estado && { estado: data.estado }),
          tasaInteres: configuracion.interesAnual,
          cuotaMensual,
          fechaVencimiento,
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

      return NextResponse.json(credito);
    }

    // Si solo se actualiza el estado
    const credito = await prisma.credito.update({
      where: { id: params.id },
      data: {
        ...(data.estado && { estado: data.estado }),
      },
      include: {
        cliente: true,
        configuracionCredito: true,
        cuotas: true,
      },
    });

    return NextResponse.json(credito);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Error al actualizar crédito' },
      { status: 500 }
    );
  }
});

// DELETE: Eliminar un crédito
export const DELETE = withAuth(async (req: NextRequest, context: any) => {
  try {
    const { params, user } = context;
    
    if (!user?.empresaActivaId) {
      return NextResponse.json(
        { error: 'No hay empresa activa' },
        { status: 400 }
      );
    }

    // Verificar que el crédito pertenece a la empresa
    const creditoExistente = await prisma.credito.findFirst({
      where: {
        id: params.id,
        empresaId: user.empresaActivaId,
      },
    });

    if (!creditoExistente) {
      return NextResponse.json(
        { error: 'Crédito no encontrado' },
        { status: 404 }
      );
    }

    await prisma.credito.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: 'Crédito eliminado' });
  } catch (error) {
    return NextResponse.json(
      { error: 'Error al eliminar crédito' },
      { status: 500 }
    );
  }
});
