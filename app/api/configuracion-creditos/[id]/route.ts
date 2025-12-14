import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth } from '@/lib/middleware';

async function getHandler(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const configuracion = await prisma.configuracionCredito.findUnique({
      where: { id: params.id }
    });

    if (!configuracion) {
      return NextResponse.json(
        { error: 'Configuración no encontrada' },
        { status: 404 }
      );
    }

    return NextResponse.json(configuracion);
  } catch (error) {
    console.error('Error fetching configuracion:', error);
    return NextResponse.json(
      { error: 'Error al cargar configuración' },
      { status: 500 }
    );
  }
}

async function putHandler(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { nombre, interesAnual, tipoCalculo } = body;

    const configuracion = await prisma.configuracionCredito.update({
      where: { id: params.id },
      data: {
        ...(nombre && { nombre }),
        ...(interesAnual !== undefined && { interesAnual: parseFloat(interesAnual) }),
        ...(tipoCalculo && { tipoCalculo })
      }
    });

    return NextResponse.json(configuracion);
  } catch (error) {
    console.error('Error updating configuracion:', error);
    return NextResponse.json(
      { error: 'Error al actualizar configuración' },
      { status: 500 }
    );
  }
}

async function deleteHandler(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.configuracionCredito.delete({
      where: { id: params.id }
    });

    return NextResponse.json({ message: 'Configuración eliminada exitosamente' });
  } catch (error) {
    console.error('Error deleting configuracion:', error);
    return NextResponse.json(
      { error: 'Error al eliminar configuración' },
      { status: 500 }
    );
  }
}

export const GET = withAuth(getHandler);
export const PUT = withAuth(putHandler);
export const DELETE = withAuth(deleteHandler);
