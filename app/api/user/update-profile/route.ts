import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/jwt';

export async function PUT(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
    }

    const { profileImage } = await request.json();

    if (!profileImage) {
      return NextResponse.json({ error: 'Imagen requerida' }, { status: 400 });
    }

    // Actualizar el usuario con la imagen
    const updatedUser = await prisma.user.update({
      where: { id: decoded.userId },
      data: { profileImage },
      select: {
        id: true,
        name: true,
        email: true,
        profileImage: true,
      },
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error('Error al actualizar perfil:', error);
    return NextResponse.json({ error: 'Error al actualizar el perfil' }, { status: 500 });
  }
}
