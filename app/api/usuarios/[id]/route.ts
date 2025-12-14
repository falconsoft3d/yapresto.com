import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = request.headers.get('authorization')?.split(' ')[1];
    
    if (!token) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    jwt.verify(token, JWT_SECRET);

    const usuario = await prisma.user.findUnique({
      where: { id: params.id },
      include: {
        empresaActiva: true,
      },
    });

    if (!usuario) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    // Ocultar contraseña
    const usuarioSeguro = {
      ...usuario,
      password: undefined,
    };

    return NextResponse.json(usuarioSeguro);
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Error al obtener usuario' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = request.headers.get('authorization')?.split(' ')[1];
    
    if (!token) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    jwt.verify(token, JWT_SECRET);

    const { name, email, password } = await request.json();

    // Si se proporciona una contraseña, hashearla
    const updateData: any = {
      name,
      email,
    };

    if (password && password.trim() !== '') {
      updateData.password = await bcrypt.hash(password, 10);
    }

    const usuario = await prisma.user.update({
      where: { id: params.id },
      data: updateData,
      include: {
        empresaActiva: true,
      },
    });

    // Ocultar contraseña
    const usuarioSeguro = {
      ...usuario,
      password: undefined,
    };

    return NextResponse.json(usuarioSeguro);
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Error al actualizar usuario' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = request.headers.get('authorization')?.split(' ')[1];
    
    if (!token) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    jwt.verify(token, JWT_SECRET);

    await prisma.user.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: 'Usuario eliminado' });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Error al eliminar usuario' }, { status: 500 });
  }
}
