import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword } from '@/lib/auth';
import { signToken } from '@/lib/jwt';
import { z } from 'zod';

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(2),
});

export async function POST(req: NextRequest) {
  try {
    // Verificar si el registro está habilitado
    const allowRegistration = process.env.ALLOW_REGISTRATION === 'true';
    if (!allowRegistration) {
      return NextResponse.json(
        { error: 'El registro de nuevos usuarios no está permitido por el administrador' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { email, password, name } = registerSchema.parse(body);

    // Verificar si el usuario ya existe
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'El usuario ya existe' },
        { status: 400 }
      );
    }

    // Crear empresa por defecto para el usuario
    const hashedPassword = await hashPassword(password);
    const empresa = await prisma.empresa.create({
      data: {
        nombre: `Empresa de ${name}`,
        color: '#2563eb',
        moneda: 'USD',
      },
    });

    // Crear el usuario con la empresa asignada
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        role: 'user',
        empresaActivaId: empresa.id,
      },
      include: {
        empresaActiva: true,
      },
    });

    // Generar token
    const token = signToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      empresaActivaId: user.empresaActivaId || undefined,
    });

    return NextResponse.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        empresaActiva: user.empresaActiva,
        empresaActivaId: user.empresaActivaId,
      },
    });
  } catch (error) {
    console.error('Error en registro:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Error al registrar usuario', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
