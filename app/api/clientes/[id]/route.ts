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
  password: z.string().optional(),
});

// GET: Obtener un cliente por ID
export const GET = withAuth(async (req: NextRequest, context: any) => {
  try {
    const { params, user } = context;
    
    if (!user?.empresaActivaId) {
      return NextResponse.json(
        { error: 'No hay empresa activa' },
        { status: 400 }
      );
    }

    const cliente = await prisma.cliente.findFirst({
      where: { 
        id: params.id,
        empresaId: user.empresaActivaId,
      },
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
    const data = clienteSchema.parse(body);

    // Verificar que el cliente pertenece a la empresa
    const clienteExistente = await prisma.cliente.findFirst({
      where: {
        id: params.id,
        empresaId: user.empresaActivaId,
      },
    });

    if (!clienteExistente) {
      return NextResponse.json(
        { error: 'Cliente no encontrado' },
        { status: 404 }
      );
    }

    const updateData: any = {};
    
    // Copiar solo los campos que tienen valor
    Object.keys(data).forEach(key => {
      if (data[key as keyof typeof data] !== undefined) {
        updateData[key] = data[key as keyof typeof data];
      }
    });

    if (updateData.fechaNacimiento) {
      updateData.fechaNacimiento = new Date(updateData.fechaNacimiento);
    }

    // Solo actualizar password si se proporcionó y no está vacío
    if (!updateData.password || updateData.password === '') {
      delete updateData.password;
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
export const DELETE = withAuth(async (req: NextRequest, context: any) => {
  try {
    const { params, user } = context;
    
    if (!user?.empresaActivaId) {
      return NextResponse.json(
        { error: 'No hay empresa activa' },
        { status: 400 }
      );
    }

    // Verificar que el cliente pertenece a la empresa
    const clienteExistente = await prisma.cliente.findFirst({
      where: {
        id: params.id,
        empresaId: user.empresaActivaId,
      },
    });

    if (!clienteExistente) {
      return NextResponse.json(
        { error: 'Cliente no encontrado' },
        { status: 404 }
      );
    }

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
