import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth } from '@/lib/middleware';
import { z } from 'zod';

const clienteSchema = z.object({
  nombre: z.string().min(2).optional(),
  apellido: z.string().min(2).optional(),
  email: z.string().email().optional(),
  telefono: z.string().min(8).optional(),
  direccion: z.string().min(5).optional(),
  cedula: z.string().min(5).optional(),
  fechaNacimiento: z.string().optional(),
});

// GET: Obtener un cliente por ID
export const GET = withAuth(async (req: NextRequest, { params }: { params: { id: string } }) => {
  try {
    const cliente = await prisma.cliente.findUnique({
      where: { id: params.id },
      include: {
        creditos: {
          include: {
            pagos: true,
          },
        },
      },
    });

    if (!cliente) {
      return NextResponse.json(
        { error: 'Cliente no encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json(cliente);
  } catch (error) {
    return NextResponse.json(
      { error: 'Error al obtener cliente' },
      { status: 500 }
    );
  }
});

// PUT: Actualizar un cliente
export const PUT = withAuth(async (req: NextRequest, { params }: { params: { id: string } }) => {
  try {
    const body = await req.json();
    const data = clienteSchema.parse(body);

    const updateData: any = { ...data };
    if (data.fechaNacimiento) {
      updateData.fechaNacimiento = new Date(data.fechaNacimiento);
    }

    const cliente = await prisma.cliente.update({
      where: { id: params.id },
      data: updateData,
    });

    return NextResponse.json(cliente);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Error al actualizar cliente' },
      { status: 500 }
    );
  }
});

// DELETE: Eliminar un cliente
export const DELETE = withAuth(async (req: NextRequest, { params }: { params: { id: string } }) => {
  try {
    await prisma.cliente.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: 'Cliente eliminado' });
  } catch (error) {
    return NextResponse.json(
      { error: 'Error al eliminar cliente' },
      { status: 500 }
    );
  }
});
