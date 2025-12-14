import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/jwt';
import { z } from 'zod';

const empresaSchema = z.object({
  nombre: z.string().min(1),
  logo: z.string().optional(),
  moneda: z.string().default('EUR'),
  color: z.string().default('#2563eb'),
});

export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
    }

    const empresas = await prisma.empresa.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(empresas);
  } catch (error) {
    console.error('Error al obtener empresas:', error);
    return NextResponse.json({ error: 'Error al obtener empresas' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
    }

    const body = await req.json();
    const data = empresaSchema.parse(body);

    const empresa = await prisma.empresa.create({
      data,
    });

    return NextResponse.json(empresa, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      );
    }
    console.error('Error al crear empresa:', error);
    return NextResponse.json({ error: 'Error al crear empresa' }, { status: 500 });
  }
}
