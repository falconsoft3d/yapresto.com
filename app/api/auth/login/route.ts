import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { comparePassword } from '@/lib/auth';
import { signToken } from '@/lib/jwt';
import { z } from 'zod';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password } = loginSchema.parse(body);

    // Buscar usuario
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        empresaActiva: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Credenciales inválidas' },
        { status: 401 }
      );
    }

    // Verificar contraseña
    const isValid = await comparePassword(password, user.password);
    if (!isValid) {
      return NextResponse.json(
        { error: 'Credenciales inválidas' },
        { status: 401 }
      );
    }

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
        profileImage: user.profileImage,
        empresaActiva: user.empresaActiva,
        empresaActivaId: user.empresaActivaId,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Error al iniciar sesión' },
      { status: 500 }
    );
  }
}
