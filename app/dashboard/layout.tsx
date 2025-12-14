'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import Sidebar from './components/Sidebar';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [user, setUser] = useState<any>(null);
  const [clientes, setClientes] = useState<any[]>([]);
  const [creditos, setCreditos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Determinar tab activo basado en la ruta
  const getActiveTab = () => {
    const tabParam = searchParams.get('tab');
    if (tabParam && ['overview', 'clientes', 'evaluacion', 'creditos', 'pagos', 'cuotas', 'reportes', 'configuracion', 'perfil', 'empresas', 'usuarios', 'configuracion-creditos'].includes(tabParam)) {
      return tabParam as 'overview' | 'clientes' | 'evaluacion' | 'creditos' | 'pagos' | 'cuotas' | 'reportes' | 'configuracion' | 'perfil' | 'empresas' | 'usuarios' | 'configuracion-creditos';
    }
    if (pathname === '/dashboard') return 'overview';
    if (pathname.includes('/clientes')) return 'clientes';
    if (pathname.includes('/creditos')) return 'creditos';
    if (pathname.includes('/reportes')) return 'reportes';
    if (pathname.includes('/configuracion')) return 'configuracion';
    if (pathname.includes('/perfil')) return 'perfil';
    if (pathname.includes('/empresas')) return 'empresas';
    if (pathname.includes('/usuarios')) return 'usuarios';
    if (pathname.includes('/configuracion-creditos')) return 'configuracion-creditos';
    return 'overview';
  };

  const [activeTab, setActiveTab] = useState<'overview' | 'clientes' | 'evaluacion' | 'creditos' | 'pagos' | 'cuotas' | 'reportes' | 'configuracion' | 'perfil' | 'empresas' | 'usuarios' | 'configuracion-creditos'>(getActiveTab());

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');

    if (!token || !userData) {
      router.push('/login');
      return;
    }

    setUser(JSON.parse(userData));
    loadData(token);
  }, [router]);

  useEffect(() => {
    setActiveTab(getActiveTab());
  }, [pathname, searchParams]);

  const loadData = async (token: string) => {
    try {
      const [clientesRes, creditosRes] = await Promise.all([
        fetch('/api/clientes', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }),
        fetch('/api/creditos', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }),
      ]);

      if (clientesRes.ok) {
        const clientesData = await clientesRes.json();
        setClientes(clientesData);
      }

      if (creditosRes.ok) {
        const creditosData = await creditosRes.json();
        setCreditos(creditosData);
      }
    } catch (error) {
      console.error('Error al cargar datos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-xl font-semibold text-gray-600">Cargando...</div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      {/* Sidebar */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={(tab) => {
          setActiveTab(tab);
          router.push(`/dashboard?tab=${tab}`);
        }}
        user={user}
        onLogout={handleLogout}
        clientes={clientes}
        creditos={creditos}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {children}
      </div>
    </div>
  );
}
