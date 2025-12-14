import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth } from '@/lib/middleware';

// GET: Obtener un crédito por ID
export const GET = withAuth(async (req: NextRequest, { params }: { params: { id: string } }) => {
  try {
    const credito = await prisma.credito.findUnique({
      where: { id: params.id },
      include: {
        cliente: true,
        pagos: {
          orderBy: {
            fechaPago: 'desc',
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

// DELETE: Eliminar un crédito
export const DELETE = withAuth(async (req: NextRequest, { params }: { params: { id: string } }) => {
  try {
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
