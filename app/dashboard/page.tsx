'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function DashboardPage() {
  const router = useRouter();
  const [clientes, setClientes] = useState<any[]>([]);
  const [creditos, setCreditos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'clientes' | 'creditos' | 'reportes' | 'configuracion'>('overview');
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const token = localStorage.getItem('token');
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

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-xl font-semibold text-gray-600">Cargando...</div>
      </div>
    );
  }

  const totalCreditos = creditos.reduce((sum, c) => sum + c.monto, 0);
  const creditosActivos = creditos.filter(c => c.estado === 'activo').length;
  const montoRecuperado = creditos.reduce((sum, c) => sum + c.montoPagado, 0);

  return (
    <>
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {activeTab === 'overview' && 'Panel Principal'}
              {activeTab === 'clientes' && 'Gestión de Clientes'}
              {activeTab === 'creditos' && 'Gestión de Créditos'}
              {activeTab === 'reportes' && 'Reportes y Análisis'}
              {activeTab === 'configuracion' && 'Configuración'}
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              {new Date().toLocaleDateString('es-ES', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <button className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
              <span className="text-xl">🔔</span>
            </button>
            <button className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
              <span className="text-xl">❓</span>
            </button>
          </div>
        </div>
      </header>

      {/* Content Area */}
      <main className="flex-1 overflow-y-auto p-6">{/* Tabs para cambiar entre secciones */}
        <div className="mb-6 border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('overview')}
              className={`${
                activeTab === 'overview'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors`}
            >
              Resumen
            </button>
            <button
              onClick={() => setActiveTab('clientes')}
              className={`${
                activeTab === 'clientes'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors`}
            >
              Clientes
            </button>
            <button
              onClick={() => setActiveTab('creditos')}
              className={`${
                activeTab === 'creditos'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors`}
            >
              Créditos
            </button>
          </nav>
        </div>
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Total Clientes</p>
                      <p className="text-3xl font-bold text-gray-900 mt-2">{clientes.length}</p>
                    </div>
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <span className="text-2xl">👥</span>
                    </div>
                  </div>
                  <div className="mt-4 flex items-center text-sm">
                    <span className="text-green-600 font-medium">+12%</span>
                    <span className="text-gray-500 ml-2">vs mes anterior</span>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Créditos Activos</p>
                      <p className="text-3xl font-bold text-blue-600 mt-2">{creditosActivos}</p>
                    </div>
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <span className="text-2xl">💰</span>
                    </div>
                  </div>
                  <div className="mt-4 flex items-center text-sm">
                    <span className="text-green-600 font-medium">+8%</span>
                    <span className="text-gray-500 ml-2">vs mes anterior</span>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Monto Total</p>
                      <p className="text-3xl font-bold text-green-600 mt-2">
                        ${totalCreditos.toLocaleString()}
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                      <span className="text-2xl">💵</span>
                    </div>
                  </div>
                  <div className="mt-4 flex items-center text-sm">
                    <span className="text-green-600 font-medium">+24%</span>
                    <span className="text-gray-500 ml-2">vs mes anterior</span>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Recuperado</p>
                      <p className="text-3xl font-bold text-purple-600 mt-2">
                        ${montoRecuperado.toLocaleString()}
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                      <span className="text-2xl">📈</span>
                    </div>
                  </div>
                  <div className="mt-4 flex items-center text-sm">
                    <span className="text-green-600 font-medium">+15%</span>
                    <span className="text-gray-500 ml-2">vs mes anterior</span>
                  </div>
                </div>
              </div>

              {/* Recent Activity & Quick Actions */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Actividad Reciente</h3>
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                      <span className="text-2xl">✅</span>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">Nuevo cliente registrado</p>
                        <p className="text-xs text-gray-500">Hace 2 horas</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                      <span className="text-2xl">💳</span>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">Crédito aprobado</p>
                        <p className="text-xs text-gray-500">Hace 5 horas</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                      <span className="text-2xl">💰</span>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">Pago recibido</p>
                        <p className="text-xs text-gray-500">Hace 1 día</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Acciones Rápidas</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <a
                      href="/dashboard/clientes/nuevo"
                      className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all text-center"
                    >
                      <span className="text-3xl block mb-2">👤</span>
                      <span className="text-sm font-medium text-gray-700">Nuevo Cliente</span>
                    </a>
                    <a
                      href="/dashboard/creditos/nuevo"
                      className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-green-500 hover:bg-green-50 transition-all text-center"
                    >
                      <span className="text-3xl block mb-2">💰</span>
                      <span className="text-sm font-medium text-gray-700">Nuevo Crédito</span>
                    </a>
                    <button
                      onClick={() => setActiveTab('reportes')}
                      className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-all text-center"
                    >
                      <span className="text-3xl block mb-2">📊</span>
                      <span className="text-sm font-medium text-gray-700">Ver Reportes</span>
                    </button>
                    <button
                      onClick={() => setActiveTab('configuracion')}
                      className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-500 hover:bg-gray-50 transition-all text-center"
                    >
                      <span className="text-3xl block mb-2">⚙️</span>
                      <span className="text-sm font-medium text-gray-700">Configuración</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Clientes Tab */}
          {activeTab === 'clientes' && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Lista de Clientes</h3>
                  <p className="text-sm text-gray-500">Gestiona la información de tus clientes</p>
                </div>
                <a
                  href="/dashboard/clientes/nuevo"
                  className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 font-medium transition-colors shadow-sm"
                >
                  <span>+</span>
                  <span>Nuevo Cliente</span>
                </a>
              </div>
              <div className="bg-white shadow-sm rounded-xl overflow-hidden border border-gray-200">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Nombre
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Email
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Teléfono
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Créditos
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {clientes.map((cliente) => (
                      <tr key={cliente.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="font-medium text-gray-900">
                            {cliente.nombre} {cliente.apellido}
                          </div>
                          <div className="text-sm text-gray-500">{cliente.cedula}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {cliente.email}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {cliente.telefono}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {cliente.creditos?.length || 0}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Créditos Tab */}
          {activeTab === 'creditos' && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Lista de Créditos</h3>
                  <p className="text-sm text-gray-500">Administra todos los créditos otorgados</p>
                </div>
                <a
                  href="/dashboard/creditos/nuevo"
                  className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 font-medium transition-colors shadow-sm"
                >
                  <span>+</span>
                  <span>Nuevo Crédito</span>
                </a>
              </div>
              <div className="bg-white shadow-sm rounded-xl overflow-hidden border border-gray-200">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Cliente
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Monto
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Cuota Mensual
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Plazo
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Estado
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {creditos.map((credito) => (
                      <tr key={credito.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="font-medium text-gray-900">
                            {credito.cliente?.nombre} {credito.cliente?.apellido}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-semibold">
                          ${credito.monto.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          ${credito.cuotaMensual.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {credito.plazoMeses} meses
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              credito.estado === 'activo'
                                ? 'bg-green-100 text-green-800'
                                : credito.estado === 'pagado'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {credito.estado}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Reportes Tab */}
          {activeTab === 'reportes' && (
            <div className="text-center py-12">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
                <span className="text-3xl">📈</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Reportes y Análisis</h3>
              <p className="text-gray-500 mb-6">Esta sección estará disponible próximamente</p>
              <button className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
                Suscribirse a Actualizaciones
              </button>
            </div>
          )}

          {/* Configuración Tab */}
          {activeTab === 'configuracion' && (
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Perfil de Usuario</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Nombre</label>
                    <input
                      type="text"
                      value={user?.name || ''}
                      disabled
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                    <input
                      type="email"
                      value={user?.email || ''}
                      disabled
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
                    />
                  </div>
                </div>
        
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Preferencias</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm font-medium text-gray-700">Notificaciones por Email</span>
                    <button className="w-12 h-6 bg-blue-600 rounded-full relative">
                      <span className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full transition-all"></span>
                    </button>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm font-medium text-gray-700">Modo Oscuro</span>
                    <button className="w-12 h-6 bg-gray-300 rounded-full relative">
                      <span className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-all"></span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
