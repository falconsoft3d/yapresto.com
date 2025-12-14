import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET: Obtener información del crédito por token (sin autenticación)
export async function GET(
  req: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const { token } = params;

    const credito = await prisma.credito.findUnique({
      where: { tokenPublico: token },
      include: {
        cliente: {
          select: {
            nombre: true,
            apellido: true,
            email: true,
          },
        },
        empresa: {
          select: {
            nombre: true,
            logo: true,
            color: true,
          },
        },
        configuracionCredito: {
          select: {
            nombre: true,
            interesAnual: true,
            tipoCalculo: true,
          },
        },
        cuotas: {
          orderBy: { numeroCuota: 'asc' },
        },
      },
    });

    if (!credito) {
      return NextResponse.json(
        { error: 'Oferta de crédito no encontrada o token inválido' },
        { status: 404 }
      );
    }

    // Si ya fue respondido, mostrar el estado
    if (credito.estadoAprobacion !== 'pendiente') {
      return NextResponse.json({
        ...credito,
        yaRespondido: true,
      });
    }

    return NextResponse.json(credito);
  } catch (error) {
    console.error('Error al obtener crédito:', error);
    return NextResponse.json(
      { error: 'Error al obtener información del crédito' },
      { status: 500 }
    );
  }
}

// POST: Aprobar o rechazar el crédito (sin autenticación)
export async function POST(
  req: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const { token } = params;
    const { decision } = await req.json(); // 'aprobado' o 'rechazado'

    if (!['aprobado', 'rechazado'].includes(decision)) {
      return NextResponse.json(
        { error: 'Decisión inválida. Debe ser "aprobado" o "rechazado"' },
        { status: 400 }
      );
    }

    // Buscar el crédito
    const credito = await prisma.credito.findUnique({
      where: { tokenPublico: token },
    });

    if (!credito) {
      return NextResponse.json(
        { error: 'Oferta de crédito no encontrada o token inválido' },
        { status: 404 }
      );
    }

    // Verificar que no haya sido respondido antes
    if (credito.estadoAprobacion !== 'pendiente') {
      return NextResponse.json(
        { error: 'Esta oferta ya fue respondida anteriormente' },
        { status: 400 }
      );
    }

    // Actualizar estado
    const creditoActualizado = await prisma.credito.update({
      where: { tokenPublico: token },
      data: {
        estadoAprobacion: decision,
        fechaRespuesta: new Date(),
        // Si se aprueba y estaba en borrador, pasar a validado
        ...(decision === 'aprobado' && credito.estado === 'borrador' 
          ? { estado: 'validado' } 
          : {}),
      },
    });

    return NextResponse.json({
      success: true,
      decision,
      credito: creditoActualizado,
    });
  } catch (error) {
    console.error('Error al procesar decisión:', error);
    return NextResponse.json(
      { error: 'Error al procesar la decisión' },
      { status: 500 }
    );
  }
}
