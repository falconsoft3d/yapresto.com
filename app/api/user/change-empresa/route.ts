import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/jwt';

export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
    }

    const { empresaId } = await request.json();

    if (!empresaId) {
      return NextResponse.json({ error: 'ID de empresa requerido' }, { status: 400 });
    }

    // Verificar que la empresa existe
    const empresa = await prisma.empresa.findUnique({
      where: { id: empresaId },
    });

    if (!empresa) {
      return NextResponse.json({ error: 'Empresa no encontrada' }, { status: 404 });
    }

    // Actualizar la empresa activa del usuario
    const updatedUser = await prisma.user.update({
      where: { id: decoded.userId },
      data: { empresaActivaId: empresaId },
      select: {
        id: true,
        name: true,
        email: true,
        profileImage: true,
        empresaActivaId: true,
        empresaActiva: true,
      },
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error('Error al cambiar empresa activa:', error);
    return NextResponse.json({ error: 'Error al cambiar empresa activa' }, { status: 500 });
  }
}
