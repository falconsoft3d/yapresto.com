import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth } from '@/lib/middleware';
import crypto from 'crypto';

// POST: Generar token público para compartir
export const POST = withAuth(async (
  req: NextRequest, 
  context: { params: { id: string }, user: any }
) => {
  try {
    const { id } = context.params;
    const { user } = context;

    if (!user?.empresaActivaId) {
      return NextResponse.json(
        { error: 'No hay empresa activa' },
        { status: 400 }
      );
    }

    // Verificar que el crédito pertenece a la empresa del usuario
    const credito = await prisma.credito.findFirst({
      where: {
        id,
        empresaId: user.empresaActivaId,
      },
    });

    if (!credito) {
      return NextResponse.json(
        { error: 'Crédito no encontrado' },
        { status: 404 }
      );
    }

    // Generar token único
    const tokenPublico = crypto.randomBytes(32).toString('hex');

    // Actualizar crédito con el token
    const creditoActualizado = await prisma.credito.update({
      where: { id },
      data: {
        tokenPublico,
        estadoAprobacion: 'pendiente',
      },
    });

    // Retornar la URL pública
    const urlPublica = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/aprobacion/${tokenPublico}`;

    return NextResponse.json({
      token: tokenPublico,
      url: urlPublica,
    });
  } catch (error) {
    console.error('Error al generar token:', error);
    return NextResponse.json(
      { error: 'Error al generar token público' },
      { status: 500 }
    );
  }
});
