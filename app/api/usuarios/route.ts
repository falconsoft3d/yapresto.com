import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.split(' ')[1];
    
    if (!token) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    jwt.verify(token, JWT_SECRET);

    const usuarios = await prisma.user.findMany({
      include: {
        empresaActiva: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Ocultar contraseñas
    const usuariosSeguro = usuarios.map((u: any) => ({
      ...u,
      password: undefined,
    }));

    return NextResponse.json(usuariosSeguro);
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Error al obtener usuarios' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.split(' ')[1];
    
    if (!token) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    jwt.verify(token, JWT_SECRET);

    const { name, email, password } = await request.json();

    // Validar que el email no exista
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json({ error: 'El email ya está registrado' }, { status: 400 });
    }

    // Hash de la contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    const usuario = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
      },
      include: {
        empresaActiva: true,
      },
    });

    // Ocultar contraseña
    const usuarioSeguro = {
      ...usuario,
      password: undefined,
    };

    return NextResponse.json(usuarioSeguro, { status: 201 });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Error al crear usuario' }, { status: 500 });
  }
}
