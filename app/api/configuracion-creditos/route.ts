import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth } from '@/lib/middleware';

async function getHandler(request: NextRequest) {
  try {
    const configuraciones = await prisma.configuracionCredito.findMany({
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json(configuraciones);
  } catch (error) {
    console.error('Error fetching configuraciones:', error);
    return NextResponse.json(
      { error: 'Error al cargar configuraciones' },
      { status: 500 }
    );
  }
}

async function postHandler(request: NextRequest) {
  try {
    const body = await request.json();
    const { nombre, interesAnual, tipoCalculo } = body;

    console.log('Creating configuracion with:', { nombre, interesAnual, tipoCalculo });

    if (!nombre || interesAnual === undefined) {
      return NextResponse.json(
        { error: 'Nombre e interés anual son requeridos' },
        { status: 400 }
      );
    }

    const configuracion = await prisma.configuracionCredito.create({
      data: {
        nombre,
        interesAnual: parseFloat(interesAnual),
        tipoCalculo: tipoCalculo || 'frances'
      }
    });

    return NextResponse.json(configuracion);
  } catch (error: any) {
    console.error('Error creating configuracion:', error);
    console.error('Error details:', error.message, error.stack);
    return NextResponse.json(
      { error: error.message || 'Error al crear configuración' },
      { status: 500 }
    );
  }
}

export const GET = withAuth(getHandler);
export const POST = withAuth(postHandler);
