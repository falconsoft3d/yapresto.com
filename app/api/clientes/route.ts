import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth } from '@/lib/middleware';
import { z } from 'zod';

const clienteSchema = z.object({
  nombre: z.string().min(2),
  apellido: z.string().min(2),
  email: z.string().email(),
  telefono: z.string().min(8),
  direccion: z.string().min(5),
  cedula: z.string().min(5),
  fechaNacimiento: z.string(),
  password: z.string().optional(),
});

// GET: Obtener todos los clientes
export const GET = withAuth(async (req: NextRequest, { user }: any) => {
  try {
    if (!user?.empresaActivaId) {
      return NextResponse.json(
        { error: 'No hay empresa activa' },
        { status: 400 }
      );
    }

    const clientes = await prisma.cliente.findMany({
      where: {
        empresaId: user.empresaActivaId,
      },
      include: {
        creditos: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(clientes);
  } catch (error) {
    return NextResponse.json(
      { error: 'Error al obtener clientes' },
      { status: 500 }
    );
  }
});

// POST: Crear un nuevo cliente
export const POST = withAuth(async (req: NextRequest, { user }: any) => {
  try {
    console.log('Usuario en POST clientes:', user);
    
    if (!user?.empresaActivaId) {
      return NextResponse.json(
        { error: 'No hay empresa activa. Por favor, cierra sesión e inicia sesión nuevamente.' },
        { status: 400 }
      );
    }

    const body = await req.json();
    const data = clienteSchema.parse(body);

    const createData: any = {
      ...data,
      fechaNacimiento: new Date(data.fechaNacimiento),
      empresaId: user.empresaActivaId,
    };

    // Solo incluir password si se proporcionó
    if (data.password) {
      createData.password = data.password;
    }

    const cliente = await prisma.cliente.create({
      data: createData,
    });

    return NextResponse.json(cliente, { status: 201 });
  } catch (error) {
    console.error('Error al crear cliente:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Error al crear cliente', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
});
