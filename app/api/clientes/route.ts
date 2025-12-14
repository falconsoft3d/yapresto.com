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
});

// GET: Obtener todos los clientes
export const GET = withAuth(async (req: NextRequest) => {
  try {
    const clientes = await prisma.cliente.findMany({
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
export const POST = withAuth(async (req: NextRequest) => {
  try {
    const body = await req.json();
    const data = clienteSchema.parse(body);

    const cliente = await prisma.cliente.create({
      data: {
        ...data,
        fechaNacimiento: new Date(data.fechaNacimiento),
      },
    });

    return NextResponse.json(cliente, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Error al crear cliente' },
      { status: 500 }
    );
  }
});
