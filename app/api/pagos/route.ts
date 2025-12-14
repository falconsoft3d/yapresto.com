import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth } from '@/lib/middleware';
import { z } from 'zod';
import { calcularCuotas } from '@/lib/calculadora-creditos';

const pagoSchema = z.object({
  creditoId: z.string(),
  monto: z.number().positive(),
  metodoPago: z.enum(['efectivo', 'transferencia', 'tarjeta']),
  fechaPago: z.string(),
  tipoPago: z.enum(['cuotas', 'aporte_capital']),
  cuotasACubrir: z.number().int().min(0),
});

// POST: Registrar un nuevo pago
export const POST = withAuth(async (req: NextRequest, { user }: any) => {
  try {
    if (!user?.empresaActivaId) {
      return NextResponse.json(
        { error: 'No hay empresa activa' },
        { status: 400 }
      );
    }

    const body = await req.json();
    const { creditoId, monto, metodoPago, fechaPago, tipoPago, cuotasACubrir } = pagoSchema.parse(body);

    // Obtener el crédito con sus cuotas y configuración (verificando que pertenezca a la empresa)
    const credito = await prisma.credito.findFirst({
      where: { 
        id: creditoId,
        empresaId: user.empresaActivaId,
      },
      include: {
        cuotas: {
          orderBy: { numeroCuota: 'asc' },
        },
        configuracionCredito: true,
      },
    });

    if (!credito) {
      return NextResponse.json(
        { error: 'Crédito no encontrado' },
        { status: 404 }
      );
    }

    if (tipoPago === 'cuotas') {
      // PAGO DE CUOTAS - Lógica existente
      const cuotasPendientes = credito.cuotas.filter(c => !c.pagado);

      if (cuotasPendientes.length < cuotasACubrir) {
        return NextResponse.json(
          { error: 'No hay suficientes cuotas pendientes' },
          { status: 400 }
        );
      }

      const cuotasACubrirArray = cuotasPendientes.slice(0, cuotasACubrir);
      const montoNecesario = cuotasACubrirArray.reduce((sum, c) => sum + c.montoCuota, 0);

      if (monto < montoNecesario) {
        return NextResponse.json(
          { error: `El monto es insuficiente. Se requieren $${montoNecesario.toFixed(2)} para cubrir ${cuotasACubrir} cuota(s)` },
          { status: 400 }
        );
      }

      // Crear el pago y marcar las cuotas como pagadas en una transacción
      const resultado = await prisma.$transaction(async (tx) => {
        const pago = await tx.pago.create({
          data: {
            monto,
            metodoPago,
            tipoPago,
            fechaPago: new Date(fechaPago),
            creditoId,
          },
        });

        await tx.cuota.updateMany({
          where: {
            id: {
              in: cuotasACubrirArray.map(c => c.id),
            },
          },
          data: {
            pagado: true,
            fechaPago: new Date(fechaPago),
          },
        });

        const nuevoMontoPagado = credito.montoPagado + montoNecesario;
        const creditoActualizado = await tx.credito.update({
          where: { id: creditoId },
          data: {
            montoPagado: nuevoMontoPagado,
            estado: nuevoMontoPagado >= credito.monto ? 'pagado' : credito.estado,
          },
        });

        return { pago, creditoActualizado };
      });

      return NextResponse.json(resultado, { status: 201 });

    } else if (tipoPago === 'aporte_capital') {
      // APORTE A CAPITAL - Reducir saldo y recalcular cuotas pendientes
      const cuotasPendientes = credito.cuotas.filter(c => !c.pagado);

      if (cuotasPendientes.length === 0) {
        return NextResponse.json(
          { error: 'No hay cuotas pendientes. El crédito ya está pagado.' },
          { status: 400 }
        );
      }

      const saldoActual = credito.monto - credito.montoPagado;

      if (monto > saldoActual) {
        return NextResponse.json(
          { error: `El aporte no puede ser mayor al saldo pendiente ($${saldoActual.toFixed(2)})` },
          { status: 400 }
        );
      }

      // Crear el pago y recalcular cuotas en una transacción
      const resultado = await prisma.$transaction(async (tx) => {
        // Registrar el pago
        const pago = await tx.pago.create({
          data: {
            monto,
            metodoPago,
            tipoPago,
            fechaPago: new Date(fechaPago),
            creditoId,
          },
        });

        // Actualizar el monto pagado del crédito
        const nuevoMontoPagado = credito.montoPagado + monto;
        const nuevoSaldo = credito.monto - nuevoMontoPagado;

        // Si el aporte cubre todo el saldo, marcar todas las cuotas pendientes como pagadas
        if (nuevoSaldo <= 0) {
          await tx.cuota.updateMany({
            where: {
              creditoId,
              pagado: false,
            },
            data: {
              pagado: true,
              fechaPago: new Date(fechaPago),
            },
          });

          const creditoActualizado = await tx.credito.update({
            where: { id: creditoId },
            data: {
              montoPagado: credito.monto,
              estado: 'pagado',
            },
          });

          return { pago, creditoActualizado, cuotasRecalculadas: 0 };
        }

        // Si quedan cuotas pendientes, recalcular
        const cuotasPendientesOrdenadas = cuotasPendientes.sort((a, b) => a.numeroCuota - b.numeroCuota);
        const mesesRestantes = cuotasPendientesOrdenadas.length;
        
        // Usar la fecha de pago como nueva fecha de inicio para el recálculo
        const fechaInicioRecalculo = new Date(fechaPago);

        // Calcular las nuevas cuotas con el saldo reducido
        const nuevasCuotas = calcularCuotas(
          nuevoSaldo,
          credito.tasaInteres,
          mesesRestantes,
          fechaInicioRecalculo,
          credito.configuracionCredito.tipoCalculo
        );

        // Actualizar cada cuota pendiente con los nuevos valores
        for (let i = 0; i < cuotasPendientesOrdenadas.length; i++) {
          const cuotaExistente = cuotasPendientesOrdenadas[i];
          const cuotaNueva = nuevasCuotas[i];

          await tx.cuota.update({
            where: { id: cuotaExistente.id },
            data: {
              montoCuota: cuotaNueva.montoCuota,
              capital: cuotaNueva.capital,
              interes: cuotaNueva.interes,
              balanceInicial: cuotaNueva.balanceInicial,
              balanceFinal: cuotaNueva.balanceFinal,
            },
          });
        }

        // Actualizar el crédito
        const nuevaCuotaMensual = nuevasCuotas[0]?.montoCuota || 0;
        const creditoActualizado = await tx.credito.update({
          where: { id: creditoId },
          data: {
            montoPagado: nuevoMontoPagado,
            cuotaMensual: nuevaCuotaMensual,
            // El estado se mantiene igual a menos que se pague todo
          },
        });

        return { 
          pago, 
          creditoActualizado, 
          cuotasRecalculadas: cuotasPendientesOrdenadas.length,
          nuevaCuotaMensual,
        };
      });

      return NextResponse.json(resultado, { status: 201 });
    }

    return NextResponse.json(
      { error: 'Tipo de pago inválido' },
      { status: 400 }
    );

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      );
    }
    console.error('Error registrando pago:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    console.error('Error message:', error instanceof Error ? error.message : String(error));
    return NextResponse.json(
      { error: 'Error al registrar pago', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
});
