import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from './jwt';

export function withAuth(handler: Function) {
  return async (req: NextRequest, context: any) => {
    const authHeader = req.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);

    try {
      const decoded = verifyToken(token);
      (req as any).user = decoded;
      // Pasar el usuario en el contexto para que esté disponible en los handlers
      return handler(req, { ...context, user: decoded });
    } catch (error) {
      return NextResponse.json(
        { error: 'Token inválido' },
        { status: 401 }
      );
    }
  };
}
