'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { formatCurrency, getCurrencySymbol } from '@/lib/currency';

export default function DashboardPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [clientes, setClientes] = useState<any[]>([]);
  const [creditos, setCreditos] = useState<any[]>([]);
  const [empresas, setEmpresas] = useState<any[]>([]);
  const [usuarios, setUsuarios] = useState<any[]>([]);
  const [configuraciones, setConfiguraciones] = useState<any[]>([]);
  const [evaluaciones, setEvaluaciones] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'clientes' | 'evaluacion' | 'creditos' | 'pagos' | 'cuotas' | 'reportes' | 'configuracion' | 'perfil' | 'empresas' | 'usuarios' | 'configuracion-creditos'>('overview');
  const [user, setUser] = useState<any>(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [imageUploading, setImageUploading] = useState(false);
  
  // Estados para filtros de cuotas
  const [clienteFilter, setClienteFilter] = useState('');
  const [estadoFilter, setEstadoFilter] = useState('');
  const [fechaDesdeFilter, setFechaDesdeFilter] = useState('');
  const [fechaHastaFilter, setFechaHastaFilter] = useState('');
  const [vistaGrafico, setVistaGrafico] = useState<'dia' | 'mes' | 'año'>('mes');
  const [mostrarGrafico, setMostrarGrafico] = useState(false);
  const [paginaCuotas, setPaginaCuotas] = useState(1);
  const [pagoSeleccionado, setPagoSeleccionado] = useState<any>(null);
  const [mostrarDetallePago, setMostrarDetallePago] = useState(false);
  const cuotasPorPagina = 20;

  // Obtener moneda de la empresa activa
  const empresaActiva = empresas.find(e => e.id === user?.empresaActivaId);
  const monedaEmpresa = empresaActiva?.moneda || 'USD';
  const simboloMoneda = getCurrencySymbol(monedaEmpresa);

  // Helper function para formatear moneda con la moneda de la empresa
  const formatMoney = (amount: number, decimals = 2) => formatCurrency(amount, monedaEmpresa, { decimals });

  const handleDeleteEmpresa = async (id: string, nombre: string) => {
    if (!confirm(`¿Estás seguro de eliminar la empresa "${nombre}"?`)) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/empresas/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        throw new Error('Error al eliminar empresa');
      }

      // Recargar empresas
      setEmpresas(empresas.filter(e => e.id !== id));
    } catch (err) {
      console.error('Error:', err);
      alert('Error al eliminar la empresa');
    }
  };

  const handleActivarEmpresa = async (id: string) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/user/change-empresa', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ empresaId: id }),
      });

      if (!res.ok) {
        throw new Error('Error al activar empresa');
      }

      const data = await res.json();
      
      // Guardar el nuevo token y usuario
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      setUser(data.user);
      
      // Recargar la página para aplicar cambios
      window.location.reload();
    } catch (err) {
      console.error('Error:', err);
      alert('Error al activar la empresa');
    }
  };

  const handleDeleteUsuario = async (id: string, nombre: string) => {
    if (!confirm(`¿Estás seguro de eliminar el usuario "${nombre}"?`)) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/usuarios/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        throw new Error('Error al eliminar usuario');
      }

      // Recargar usuarios
      setUsuarios(usuarios.filter(u => u.id !== id));
    } catch (err) {
      console.error('Error:', err);
      alert('Error al eliminar el usuario');
    }
  };

  const handleDeleteCliente = async (id: string, nombre: string) => {
    if (!confirm(`¿Estás seguro de eliminar el cliente "${nombre}"?`)) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/clientes/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        throw new Error('Error al eliminar cliente');
      }

      // Recargar clientes
      setClientes(clientes.filter(c => c.id !== id));
    } catch (err) {
      console.error('Error:', err);
      alert('Error al eliminar el cliente');
    }
  };

  const handleDeleteConfiguracion = async (id: string, nombre: string) => {
    if (!confirm(`¿Estás seguro de eliminar la configuración "${nombre}"?`)) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/configuracion-creditos/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        throw new Error('Error al eliminar configuración');
      }

      // Recargar configuraciones
      setConfiguraciones(configuraciones.filter(c => c.id !== id));
    } catch (err) {
      console.error('Error:', err);
      alert('Error al eliminar la configuración');
    }
  };

  const handleDeleteCredito = async (id: string, clienteNombre: string) => {
    if (!confirm(`¿Estás seguro de eliminar el crédito de "${clienteNombre}"?`)) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/creditos/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        throw new Error('Error al eliminar crédito');
      }

      // Recargar créditos
      setCreditos(creditos.filter(c => c.id !== id));
    } catch (err) {
      console.error('Error:', err);
      alert('Error al eliminar el crédito');
    }
  };

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab && ['overview', 'clientes', 'evaluacion', 'creditos', 'pagos', 'cuotas', 'reportes', 'configuracion', 'perfil', 'empresas', 'usuarios', 'configuracion-creditos'].includes(tab)) {
      setActiveTab(tab as any);
    }
  }, [searchParams]);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      const user = JSON.parse(userData);
      setUser(user);
      
      // Verificar si el usuario tiene empresaActivaId
      if (!user.empresaActivaId) {
        alert('Tu sesión no tiene una empresa activa asignada. Por favor, inicia sesión nuevamente.');
        localStorage.clear();
        router.push('/login');
        return;
      }
    }
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const token = localStorage.getItem('token');
      const [clientesRes, creditosRes, empresasRes, usuariosRes, configuracionesRes, evaluacionesRes] = await Promise.all([
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
        fetch('/api/empresas', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }),
        fetch('/api/usuarios', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }),
        fetch('/api/configuracion-creditos', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }),
        fetch('/api/evaluaciones', {
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

      if (empresasRes.ok) {
        const empresasData = await empresasRes.json();
        setEmpresas(empresasData);
      }

      if (usuariosRes.ok) {
        const usuariosData = await usuariosRes.json();
        setUsuarios(usuariosData);
      }

      if (configuracionesRes.ok) {
        const configuracionesData = await configuracionesRes.json();
        setConfiguraciones(configuracionesData);
      }

      if (evaluacionesRes.ok) {
        const evaluacionesData = await evaluacionesRes.json();
        setEvaluaciones(evaluacionesData);
      }
    } catch (error) {
      console.error('Error al cargar datos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError('Las contraseñas no coinciden');
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      setPasswordError('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/user/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Error al cambiar la contraseña');
      }

      setPasswordSuccess('Contraseña actualizada exitosamente');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setTimeout(() => {
        setShowPasswordModal(false);
        setPasswordSuccess('');
      }, 2000);
    } catch (err: any) {
      setPasswordError(err.message);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('La imagen debe ser menor a 5MB');
      return;
    }

    setImageUploading(true);

    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64Image = reader.result as string;
        
        const token = localStorage.getItem('token');
        const res = await fetch('/api/user/update-profile', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            profileImage: base64Image,
          }),
        });

        if (!res.ok) {
          throw new Error('Error al subir la imagen');
        }

        const updatedUser = await res.json();
        setUser(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));
        setImageUploading(false);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error('Error al subir imagen:', err);
      alert('Error al subir la imagen');
      setImageUploading(false);
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
              {activeTab === 'evaluacion' && 'Evaluación Crediticia'}
              {activeTab === 'creditos' && 'Gestión de Créditos'}
              {activeTab === 'pagos' && 'Registro de Pagos'}
              {activeTab === 'cuotas' && 'Gestión de Cuotas'}
              {activeTab === 'empresas' && 'Gestión de Empresas'}
              {activeTab === 'usuarios' && 'Gestión de Usuarios'}
              {activeTab === 'configuracion-creditos' && 'Configuración de Créditos'}
              {activeTab === 'perfil' && 'Mi Perfil'}
            </h2>
            <div className="flex items-center space-x-4 mt-1">
              <p className="text-sm text-gray-500">
                {new Date().toLocaleDateString('es-ES', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </p>
              {user?.empresaActiva && (
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-400">•</span>
                  <div className="flex items-center space-x-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: user.empresaActiva.color }}
                    />
                    <span className="text-sm font-medium" style={{ color: user.empresaActiva.color }}>
                      {user.empresaActiva.nombre}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-4">
            {user?.empresaActiva && (
              <div className="flex items-center space-x-2 px-3 py-2 rounded-lg bg-gray-50 border border-gray-200">
                <div 
                  className="w-2.5 h-2.5 rounded-full" 
                  style={{ backgroundColor: user.empresaActiva.color }}
                />
                <span className="text-sm font-medium text-gray-700">
                  {user.empresaActiva.nombre}
                </span>
              </div>
            )}
            <button 
              onClick={() => setActiveTab('perfil')}
              className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div 
                className="w-8 h-8 rounded-full flex items-center justify-center overflow-hidden"
                style={{ backgroundColor: user?.empresaActiva?.color || '#2563eb' }}
              >
                {user?.profileImage ? (
                  <img src={user.profileImage} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <i className="fa-solid fa-user text-white text-sm"></i>
                )}
              </div>
            </button>
          </div>
        </div>
      </header>

      {/* Content Area */}
      <main className="flex-1 overflow-y-auto p-6">
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
                    <i className="fa-solid fa-users text-2xl text-blue-600"></i>
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
                    <i className="fa-solid fa-money-bill-wave text-2xl text-green-600"></i>
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
                      {formatMoney(totalCreditos)}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <i className="fa-solid fa-dollar-sign text-2xl text-green-600"></i>
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
                      {formatMoney(montoRecuperado)}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                    <i className="fa-solid fa-chart-line text-2xl text-purple-600"></i>
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
                    <i className="fa-solid fa-user-plus text-2xl text-green-600"></i>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">Nuevo cliente registrado</p>
                      <p className="text-xs text-gray-500">Hace 2 horas</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                    <i className="fa-solid fa-check-circle text-2xl text-blue-600"></i>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">Crédito aprobado</p>
                      <p className="text-xs text-gray-500">Hace 5 horas</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                    <i className="fa-solid fa-coins text-2xl text-yellow-600"></i>
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
                    <i className="fa-solid fa-user-plus text-3xl text-blue-600 block mb-2"></i>
                    <span className="text-sm font-medium text-gray-700">Nuevo Cliente</span>
                  </a>
                  <a
                    href="/dashboard/creditos/nuevo"
                    className="p-4 border-2 border-dashed border-gray-300 rounded-lg transition-all text-center"
                    style={{ 
                      borderColor: user?.empresaActiva?.color || '#10b981',
                      '--hover-bg': `${user?.empresaActiva?.color || '#10b981'}20`
                    } as React.CSSProperties}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = `${user?.empresaActiva?.color || '#10b981'}20`;
                      e.currentTarget.style.borderColor = user?.empresaActiva?.color || '#10b981';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                      e.currentTarget.style.borderColor = '#d1d5db';
                    }}
                  >
                    <i className="fa-solid fa-money-bill-wave text-3xl block mb-2" style={{ color: user?.empresaActiva?.color || '#10b981' }}></i>
                    <span className="text-sm font-medium text-gray-700">Nuevo Crédito</span>
                  </a>
                  <button
                    onClick={() => setActiveTab('reportes')}
                    className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-all text-center"
                  >
                    <i className="fa-solid fa-chart-bar text-3xl text-purple-600 block mb-2"></i>
                    <span className="text-sm font-medium text-gray-700">Ver Reportes</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('configuracion')}
                    className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-500 hover:bg-gray-50 transition-all text-center"
                  >
                    <i className="fa-solid fa-gear text-3xl text-gray-600 block mb-2"></i>
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
                className="flex items-center space-x-2 text-white px-4 py-2 rounded-lg font-medium transition-all shadow-sm hover:shadow-md hover:scale-105"
                style={{ backgroundColor: user?.empresaActiva?.color || '#2563eb' }}
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
                      Empresa
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Créditos
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Acciones
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
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: empresas.find(e => e.id === cliente.empresaId)?.color || '#6b7280' }}></div>
                          <span className="text-sm text-gray-600">{empresas.find(e => e.id === cliente.empresaId)?.nombre || 'N/A'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {cliente.creditos?.length || 0}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end space-x-2">
                          <button
                            onClick={() => router.push(`/dashboard/clientes/${cliente.id}/editar`)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            Editar
                          </button>
                          <button
                            onClick={() => handleDeleteCliente(cliente.id, `${cliente.nombre} ${cliente.apellido}`)}
                            className="text-red-600 hover:text-red-900"
                          >
                            Eliminar
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Evaluación Tab */}
        {activeTab === 'evaluacion' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Evaluación Crediticia</h3>
                <p className="text-sm text-gray-500">Evalúa la capacidad de endeudamiento de tus clientes</p>
              </div>
              <a
                href="/dashboard/evaluacion/nuevo"
                className="flex items-center space-x-2 text-white px-4 py-2 rounded-lg font-medium transition-all shadow-sm hover:shadow-md hover:scale-105"
                style={{ backgroundColor: user?.empresaActiva?.color || '#2563eb' }}
              >
                <span>+</span>
                <span>Nueva Evaluación</span>
              </a>
            </div>
            <div className="bg-white shadow-sm rounded-xl overflow-hidden border border-gray-200">
              {evaluaciones.length > 0 ? (
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Cliente
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Ingresos Mensuales
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Gastos Mensuales
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Capacidad de Endeudamiento
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        % Endeudamiento
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Empresa
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Fecha
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {evaluaciones.map((evaluacion: any) => (
                      <tr key={evaluacion.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {evaluacion.cliente?.nombre} {evaluacion.cliente?.apellido}
                          </div>
                          <div className="text-sm text-gray-500">{evaluacion.cliente?.cedula}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                          {formatMoney(evaluacion.ingresosMensuales)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600 font-medium">
                          {formatMoney(evaluacion.gastosMensuales)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-bold text-green-600">
                            {formatMoney(evaluacion.capacidadEndeudamiento)}
                          </div>
                          <div className="text-xs text-gray-500">
                            Cuota máxima mensual
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {evaluacion.porcentajeEndeudamiento}%
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-2">
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: empresas.find(e => e.id === evaluacion.cliente?.empresaId)?.color || '#6b7280' }}></div>
                            <span className="text-sm text-gray-600">{empresas.find(e => e.id === evaluacion.cliente?.empresaId)?.nombre || 'N/A'}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(evaluacion.createdAt).toLocaleDateString('es-ES')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="p-8 text-center">
                  <i className="fa-solid fa-chart-pie text-5xl text-gray-400 block mb-4"></i>
                  <p className="text-gray-600 mb-2">No hay evaluaciones registradas</p>
                  <a
                    href="/dashboard/evaluacion/nuevo"
                    className="inline-flex items-center text-blue-600 hover:text-blue-700"
                  >
                    <span>+</span>
                    <span className="ml-1">Crear primera evaluación</span>
                  </a>
                </div>
              )}
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
                className="flex items-center space-x-2 text-white px-4 py-2 rounded-lg font-medium transition-all shadow-sm hover:shadow-md hover:scale-105"
                style={{ backgroundColor: user?.empresaActiva?.color || '#2563eb' }}
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
                      Empresa
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Estado
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Acciones
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
                        {formatMoney(credito.monto)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatMoney(credito.cuotaMensual)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {credito.plazoMeses} meses
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: empresas.find(e => e.id === credito.empresaId)?.color || '#6b7280' }}></div>
                          <span className="text-sm text-gray-600">{empresas.find(e => e.id === credito.empresaId)?.nombre || 'N/A'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            credito.estado === 'borrador'
                              ? 'bg-gray-100 text-gray-800'
                              : credito.estado === 'validado'
                              ? 'bg-yellow-100 text-yellow-800'
                              : credito.estado === 'activo'
                              ? 'bg-green-100 text-green-800'
                              : credito.estado === 'pagado'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {credito.estado}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end space-x-2">
                          <button
                            onClick={() => router.push(`/dashboard/creditos/${credito.id}/cuotas`)}
                            className="text-green-600 hover:text-green-900"
                            title="Ver cuotas"
                          >
                            <i className="fa-solid fa-calculator"></i>
                          </button>
                          <button
                            onClick={() => router.push(`/dashboard/creditos/${credito.id}/editar`)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            Editar
                          </button>
                          <button
                            onClick={() => handleDeleteCredito(credito.id, `${credito.cliente?.nombre} ${credito.cliente?.apellido}`)}
                            className="text-red-600 hover:text-red-900"
                          >
                            Eliminar
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Pagos Tab */}
        {activeTab === 'pagos' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Registro de Pagos</h3>
                <p className="text-sm text-gray-500">Registra los pagos de cuotas de créditos</p>
              </div>
              <a
                href="/dashboard/pagos/nuevo"
                className="flex items-center space-x-2 text-white px-4 py-2 rounded-lg font-medium transition-all shadow-sm hover:shadow-md hover:scale-105"
                style={{ backgroundColor: user?.empresaActiva?.color || '#2563eb' }}
              >
                <span>+</span>
                <span>Registrar Pago</span>
              </a>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Fecha
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Cliente
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Crédito
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tipo
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Monto Pagado
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Método
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Empresa
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {creditos.flatMap(credito => 
                    credito.pagos?.map((pago: any) => (
                      <tr key={pago.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {new Date(pago.fechaPago).toLocaleDateString('es-ES')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {credito.cliente?.nombre} {credito.cliente?.apellido}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatMoney(credito.monto)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {pago.tipoPago === 'cuotas' ? (
                            <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                              <i className="fa-solid fa-calendar-check mr-1"></i>
                              Cuotas
                            </span>
                          ) : (
                            <span className="px-2 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800">
                              <i className="fa-solid fa-piggy-bank mr-1"></i>
                              Aporte a Capital
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-green-600">
                          {formatMoney(pago.monto)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                            {pago.metodoPago}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-2">
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: empresas.find(e => e.id === credito.empresaId)?.color || '#6b7280' }}></div>
                            <span className="text-sm text-gray-600">{empresas.find(e => e.id === credito.empresaId)?.nombre || 'N/A'}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <button
                            onClick={() => {
                              setPagoSeleccionado({ ...pago, credito });
                              setMostrarDetallePago(true);
                            }}
                            className="text-blue-600 hover:text-blue-900 font-medium text-sm"
                            title="Ver detalle y comprobante"
                          >
                            <i className="fa-solid fa-eye mr-1"></i>
                            Ver Detalle
                          </button>
                        </td>
                      </tr>
                    )) || []
                  )}
                  {creditos.every(c => !c.pagos || c.pagos.length === 0) && (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center">
                        <i className="fa-solid fa-hand-holding-dollar text-5xl text-gray-400 block mb-4"></i>
                        <p className="text-gray-600 mb-2">No hay pagos registrados</p>
                        <a
                          href="/dashboard/pagos/nuevo"
                          className="inline-flex items-center text-blue-600 hover:text-blue-700"
                        >
                          <span>+</span>
                          <span className="ml-1">Registrar primer pago</span>
                        </a>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Modal de Detalle de Pago */}
            {mostrarDetallePago && pagoSeleccionado && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                  {/* Header del modal */}
                  <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                    <h3 className="text-xl font-bold text-gray-900">
                      <i className="fa-solid fa-receipt mr-2 text-blue-600"></i>
                      Comprobante de Pago
                    </h3>
                    <button
                      onClick={() => setMostrarDetallePago(false)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <i className="fa-solid fa-times text-xl"></i>
                    </button>
                  </div>

                  {/* Contenido del comprobante */}
                  <div id="comprobante-pago" className="p-8">
                    {/* Logo y empresa */}
                    <div className="text-center mb-6 pb-6 border-b border-gray-200">
                      {user?.empresaActiva?.logo && (
                        <img
                          src={user.empresaActiva.logo}
                          alt="Logo"
                          className="h-16 mx-auto mb-3"
                        />
                      )}
                      <h2 className="text-2xl font-bold" style={{ color: user?.empresaActiva?.color || '#2563eb' }}>
                        {user?.empresaActiva?.nombre || 'YaPresto'}
                      </h2>
                      <p className="text-gray-600 text-sm mt-1">Comprobante de Pago</p>
                      <p className="text-gray-500 text-xs mt-1">
                        Fecha de emisión: {new Date().toLocaleDateString('es-ES')}
                      </p>
                    </div>

                    {/* Información del cliente */}
                    <div className="bg-gray-50 rounded-lg p-4 mb-6">
                      <h4 className="font-semibold text-gray-900 mb-3">Información del Cliente</h4>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <span className="text-gray-600">Nombre:</span>
                          <p className="font-medium text-gray-900">
                            {pagoSeleccionado.credito?.cliente?.nombre} {pagoSeleccionado.credito?.cliente?.apellido}
                          </p>
                        </div>
                        <div>
                          <span className="text-gray-600">Cédula:</span>
                          <p className="font-medium text-gray-900">{pagoSeleccionado.credito?.cliente?.cedula}</p>
                        </div>
                        <div>
                          <span className="text-gray-600">Email:</span>
                          <p className="font-medium text-gray-900">{pagoSeleccionado.credito?.cliente?.email}</p>
                        </div>
                        <div>
                          <span className="text-gray-600">Teléfono:</span>
                          <p className="font-medium text-gray-900">{pagoSeleccionado.credito?.cliente?.telefono}</p>
                        </div>
                      </div>
                    </div>

                    {/* Información del crédito */}
                    <div className="bg-blue-50 rounded-lg p-4 mb-6">
                      <h4 className="font-semibold text-gray-900 mb-3">Información del Crédito</h4>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <span className="text-gray-600">Monto del Crédito:</span>
                          <p className="font-medium text-gray-900">${pagoSeleccionado.credito?.monto.toLocaleString()}</p>
                        </div>
                        <div>
                          <span className="text-gray-600">Tasa de Interés:</span>
                          <p className="font-medium text-gray-900">{pagoSeleccionado.credito?.tasaInteres}%</p>
                        </div>
                        <div>
                          <span className="text-gray-600">Plazo:</span>
                          <p className="font-medium text-gray-900">{pagoSeleccionado.credito?.plazoMeses} meses</p>
                        </div>
                        <div>
                          <span className="text-gray-600">Cuota Mensual:</span>
                          <p className="font-medium text-gray-900">${pagoSeleccionado.credito?.cuotaMensual.toFixed(2)}</p>
                        </div>
                      </div>
                    </div>

                    {/* Detalle del pago */}
                    <div className="bg-green-50 rounded-lg p-4 mb-6">
                      <h4 className="font-semibold text-gray-900 mb-3">Detalle del Pago</h4>
                      <div className="space-y-3 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Fecha de Pago:</span>
                          <p className="font-medium text-gray-900">
                            {new Date(pagoSeleccionado.fechaPago).toLocaleDateString('es-ES', {
                              weekday: 'long',
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </p>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Tipo de Pago:</span>
                          <p className="font-medium text-gray-900">
                            {pagoSeleccionado.tipoPago === 'cuotas' ? 'Pago de Cuotas' : 'Aporte a Capital'}
                          </p>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Método de Pago:</span>
                          <p className="font-medium text-gray-900 capitalize">{pagoSeleccionado.metodoPago}</p>
                        </div>
                        <div className="pt-3 border-t border-green-200">
                          <div className="flex justify-between items-center">
                            <span className="text-lg font-semibold text-gray-900">Monto Pagado:</span>
                            <p className="text-2xl font-bold text-green-600">
                              ${pagoSeleccionado.monto.toLocaleString()}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Nota al pie */}
                    <div className="text-center text-xs text-gray-500 pt-6 border-t border-gray-200">
                      <p>Este comprobante es válido como constancia de pago</p>
                      <p className="mt-1">ID de transacción: {pagoSeleccionado.id}</p>
                    </div>
                  </div>

                  {/* Footer con botones */}
                  <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex justify-end space-x-3">
                    <button
                      onClick={() => setMostrarDetallePago(false)}
                      className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 font-medium transition-colors"
                    >
                      Cerrar
                    </button>
                    <button
                      onClick={async () => {
                        const { jsPDF } = await import('jspdf');
                        const pdf = new jsPDF('p', 'mm', 'a4');
                        const pageWidth = pdf.internal.pageSize.getWidth();
                        const margin = 20;
                        let yPos = 20;

                        // Logo y empresa
                        pdf.setFontSize(20);
                        pdf.setFont('helvetica', 'bold');
                        const empresaColor = user?.empresaActiva?.color || '#2563eb';
                        const [r, g, b] = [
                          parseInt(empresaColor.slice(1, 3), 16),
                          parseInt(empresaColor.slice(3, 5), 16),
                          parseInt(empresaColor.slice(5, 7), 16)
                        ];
                        pdf.setTextColor(r, g, b);
                        pdf.text(user?.empresaActiva?.nombre || 'YaPresto', pageWidth / 2, yPos, { align: 'center' });
                        
                        yPos += 8;
                        pdf.setFontSize(12);
                        pdf.setFont('helvetica', 'normal');
                        pdf.setTextColor(100);
                        pdf.text('COMPROBANTE DE PAGO', pageWidth / 2, yPos, { align: 'center' });
                        
                        yPos += 6;
                        pdf.setFontSize(9);
                        pdf.text(`Fecha de emisión: ${new Date().toLocaleDateString('es-ES')}`, pageWidth / 2, yPos, { align: 'center' });
                        
                        // Línea separadora
                        yPos += 8;
                        pdf.setDrawColor(200);
                        pdf.line(margin, yPos, pageWidth - margin, yPos);
                        yPos += 10;

                        // Información del Cliente
                        pdf.setFillColor(245, 245, 245);
                        pdf.rect(margin, yPos, pageWidth - 2 * margin, 35, 'F');
                        yPos += 7;
                        pdf.setFontSize(11);
                        pdf.setFont('helvetica', 'bold');
                        pdf.setTextColor(0);
                        pdf.text('INFORMACIÓN DEL CLIENTE', margin + 5, yPos);
                        
                        yPos += 7;
                        pdf.setFontSize(9);
                        pdf.setFont('helvetica', 'normal');
                        pdf.setTextColor(80);
                        pdf.text('Nombre:', margin + 5, yPos);
                        pdf.setFont('helvetica', 'bold');
                        pdf.setTextColor(0);
                        pdf.text(`${pagoSeleccionado.credito?.cliente?.nombre} ${pagoSeleccionado.credito?.cliente?.apellido}`, margin + 30, yPos);
                        
                        pdf.setFont('helvetica', 'normal');
                        pdf.setTextColor(80);
                        pdf.text('Cédula:', pageWidth / 2 + 10, yPos);
                        pdf.setFont('helvetica', 'bold');
                        pdf.setTextColor(0);
                        pdf.text(pagoSeleccionado.credito?.cliente?.cedula, pageWidth / 2 + 30, yPos);
                        
                        yPos += 6;
                        pdf.setFont('helvetica', 'normal');
                        pdf.setTextColor(80);
                        pdf.text('Email:', margin + 5, yPos);
                        pdf.setFont('helvetica', 'bold');
                        pdf.setTextColor(0);
                        pdf.text(pagoSeleccionado.credito?.cliente?.email, margin + 30, yPos);
                        
                        yPos += 6;
                        pdf.setFont('helvetica', 'normal');
                        pdf.setTextColor(80);
                        pdf.text('Teléfono:', margin + 5, yPos);
                        pdf.setFont('helvetica', 'bold');
                        pdf.setTextColor(0);
                        pdf.text(pagoSeleccionado.credito?.cliente?.telefono, margin + 30, yPos);
                        
                        yPos += 12;

                        // Información del Crédito
                        pdf.setFillColor(239, 246, 255);
                        pdf.rect(margin, yPos, pageWidth - 2 * margin, 30, 'F');
                        yPos += 7;
                        pdf.setFontSize(11);
                        pdf.setFont('helvetica', 'bold');
                        pdf.setTextColor(0);
                        pdf.text('INFORMACIÓN DEL CRÉDITO', margin + 5, yPos);
                        
                        yPos += 7;
                        pdf.setFontSize(9);
                        pdf.setFont('helvetica', 'normal');
                        pdf.setTextColor(80);
                        pdf.text('Monto:', margin + 5, yPos);
                        pdf.setFont('helvetica', 'bold');
                        pdf.setTextColor(0);
                        pdf.text(formatMoney(pagoSeleccionado.credito?.monto), margin + 30, yPos);
                        
                        pdf.setFont('helvetica', 'normal');
                        pdf.setTextColor(80);
                        pdf.text('Tasa:', pageWidth / 2 + 10, yPos);
                        pdf.setFont('helvetica', 'bold');
                        pdf.setTextColor(0);
                        pdf.text(`${pagoSeleccionado.credito?.tasaInteres}%`, pageWidth / 2 + 30, yPos);
                        
                        yPos += 6;
                        pdf.setFont('helvetica', 'normal');
                        pdf.setTextColor(80);
                        pdf.text('Plazo:', margin + 5, yPos);
                        pdf.setFont('helvetica', 'bold');
                        pdf.setTextColor(0);
                        pdf.text(`${pagoSeleccionado.credito?.plazoMeses} meses`, margin + 30, yPos);
                        
                        pdf.setFont('helvetica', 'normal');
                        pdf.setTextColor(80);
                        pdf.text('Cuota:', pageWidth / 2 + 10, yPos);
                        pdf.setFont('helvetica', 'bold');
                        pdf.setTextColor(0);
                        pdf.text(formatMoney(pagoSeleccionado.credito?.cuotaMensual), pageWidth / 2 + 30, yPos);
                        
                        yPos += 12;

                        // Detalle del Pago
                        pdf.setFillColor(240, 253, 244);
                        pdf.rect(margin, yPos, pageWidth - 2 * margin, 40, 'F');
                        yPos += 7;
                        pdf.setFontSize(11);
                        pdf.setFont('helvetica', 'bold');
                        pdf.setTextColor(0);
                        pdf.text('DETALLE DEL PAGO', margin + 5, yPos);
                        
                        yPos += 7;
                        pdf.setFontSize(9);
                        pdf.setFont('helvetica', 'normal');
                        pdf.setTextColor(80);
                        pdf.text('Fecha:', margin + 5, yPos);
                        pdf.setFont('helvetica', 'bold');
                        pdf.setTextColor(0);
                        const fechaPago = new Date(pagoSeleccionado.fechaPago).toLocaleDateString('es-ES', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        });
                        pdf.text(fechaPago, margin + 30, yPos);
                        
                        yPos += 6;
                        pdf.setFont('helvetica', 'normal');
                        pdf.setTextColor(80);
                        pdf.text('Tipo:', margin + 5, yPos);
                        pdf.setFont('helvetica', 'bold');
                        pdf.setTextColor(0);
                        pdf.text(pagoSeleccionado.tipoPago === 'cuotas' ? 'Pago de Cuotas' : 'Aporte a Capital', margin + 30, yPos);
                        
                        yPos += 6;
                        pdf.setFont('helvetica', 'normal');
                        pdf.setTextColor(80);
                        pdf.text('Método:', margin + 5, yPos);
                        pdf.setFont('helvetica', 'bold');
                        pdf.setTextColor(0);
                        pdf.text(pagoSeleccionado.metodoPago.charAt(0).toUpperCase() + pagoSeleccionado.metodoPago.slice(1), margin + 30, yPos);
                        
                        yPos += 10;
                        pdf.setDrawColor(34, 197, 94);
                        pdf.line(margin + 5, yPos, pageWidth - margin - 5, yPos);
                        yPos += 7;
                        
                        pdf.setFontSize(12);
                        pdf.setFont('helvetica', 'bold');
                        pdf.setTextColor(0);
                        pdf.text('MONTO PAGADO:', margin + 5, yPos);
                        pdf.setFontSize(16);
                        pdf.setTextColor(34, 197, 94);
                        pdf.text(formatMoney(pagoSeleccionado.monto), pageWidth - margin - 5, yPos, { align: 'right' });
                        
                        // Nota al pie
                        yPos = pdf.internal.pageSize.getHeight() - 30;
                        pdf.setDrawColor(200);
                        pdf.line(margin, yPos, pageWidth - margin, yPos);
                        yPos += 6;
                        pdf.setFontSize(8);
                        pdf.setFont('helvetica', 'normal');
                        pdf.setTextColor(120);
                        pdf.text('Este comprobante es válido como constancia de pago', pageWidth / 2, yPos, { align: 'center' });
                        yPos += 4;
                        pdf.text(`ID de transacción: ${pagoSeleccionado.id}`, pageWidth / 2, yPos, { align: 'center' });
                        
                        // Guardar PDF
                        const nombreArchivo = `Comprobante_${pagoSeleccionado.credito?.cliente?.cedula}_${new Date().getTime()}.pdf`;
                        pdf.save(nombreArchivo);
                      }}
                      className="px-4 py-2 text-white rounded-lg font-medium transition-colors shadow-sm hover:shadow-md"
                      style={{ backgroundColor: user?.empresaActiva?.color || '#2563eb' }}
                    >
                      <i className="fa-solid fa-download mr-2"></i>
                      Descargar Comprobante
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Cuotas Tab */}
        {activeTab === 'cuotas' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Todas las Cuotas</h3>
                <p className="text-sm text-gray-500">Visualiza y filtra todas las cuotas de los créditos</p>
              </div>
              {(clienteFilter || estadoFilter || fechaDesdeFilter || fechaHastaFilter) && (
                <button
                  onClick={() => {
                    setClienteFilter('');
                    setEstadoFilter('');
                    setFechaDesdeFilter('');
                    setFechaHastaFilter('');
                  }}
                  className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  <i className="fa-solid fa-filter-circle-xmark"></i>
                  <span>Limpiar Filtros</span>
                </button>
              )}
            </div>

            {/* Botón para mostrar/ocultar gráfico */}
            <div className="mb-6">
              <button
                onClick={() => setMostrarGrafico(!mostrarGrafico)}
                className="flex items-center space-x-2 text-white px-4 py-2 rounded-lg font-medium transition-all shadow-sm hover:shadow-md hover:scale-105"
                style={{ backgroundColor: user?.empresaActiva?.color || '#2563eb' }}
              >
                <i className={`fa-solid ${mostrarGrafico ? 'fa-chart-line-down' : 'fa-chart-line'}`}></i>
                <span>{mostrarGrafico ? 'Ocultar Gráfico' : 'Mostrar Gráfico'}</span>
              </button>
            </div>

            {/* Gráfico de Ingresos */}
            {mostrarGrafico && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900">
                      <i className="fa-solid fa-chart-line mr-2 text-blue-600"></i>
                      Análisis de Estado de Cuotas
                    </h4>
                    <p className="text-sm text-gray-500 mt-1">Montos de cuotas por estado y período</p>
                  </div>
                  <div className="flex space-x-2">
                  <button
                    onClick={() => setVistaGrafico('dia')}
                    className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                      vistaGrafico === 'dia'
                        ? 'text-white shadow-sm'
                        : 'text-gray-700 bg-gray-100 hover:bg-gray-200'
                    }`}
                    style={vistaGrafico === 'dia' ? { backgroundColor: user?.empresaActiva?.color || '#2563eb' } : {}}
                  >
                    <i className="fa-solid fa-calendar-day mr-2"></i>
                    Por Día
                  </button>
                  <button
                    onClick={() => setVistaGrafico('mes')}
                    className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                      vistaGrafico === 'mes'
                        ? 'text-white shadow-sm'
                        : 'text-gray-700 bg-gray-100 hover:bg-gray-200'
                    }`}
                    style={vistaGrafico === 'mes' ? { backgroundColor: user?.empresaActiva?.color || '#2563eb' } : {}}
                  >
                    <i className="fa-solid fa-calendar-alt mr-2"></i>
                    Por Mes
                  </button>
                  <button
                    onClick={() => setVistaGrafico('año')}
                    className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                      vistaGrafico === 'año'
                        ? 'text-white shadow-sm'
                        : 'text-gray-700 bg-gray-100 hover:bg-gray-200'
                    }`}
                    style={vistaGrafico === 'año' ? { backgroundColor: user?.empresaActiva?.color || '#2563eb' } : {}}
                  >
                    <i className="fa-solid fa-calendar mr-2"></i>
                    Por Año
                  </button>
                </div>
              </div>
              <div style={{ width: '100%', height: 400 }}>
                <ResponsiveContainer>
                  <LineChart
                    data={(() => {
                      const datosPorPeriodo: { [key: string]: { pagado: number; pendiente: number; vencido: number } } = {};
                      
                      creditos.forEach(credito => {
                        credito.cuotas?.forEach((cuota: any) => {
                          const fecha = new Date(cuota.fechaVencimiento);
                          const hoy = new Date();
                          const estaVencida = !cuota.pagado && fecha < hoy;
                          
                          let clave = '';
                          
                          if (vistaGrafico === 'dia') {
                            clave = fecha.toISOString().split('T')[0];
                          } else if (vistaGrafico === 'mes') {
                            clave = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`;
                          } else {
                            clave = String(fecha.getFullYear());
                          }
                          
                          if (!datosPorPeriodo[clave]) {
                            datosPorPeriodo[clave] = { pagado: 0, pendiente: 0, vencido: 0 };
                          }
                          
                          if (cuota.pagado) {
                            datosPorPeriodo[clave].pagado += cuota.montoCuota;
                          } else if (estaVencida) {
                            datosPorPeriodo[clave].vencido += cuota.montoCuota;
                          } else {
                            datosPorPeriodo[clave].pendiente += cuota.montoCuota;
                          }
                        });
                      });

                      return Object.entries(datosPorPeriodo)
                        .map(([periodo, datos]) => {
                          let label = '';
                          
                          if (vistaGrafico === 'dia') {
                            label = new Date(periodo).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
                          } else if (vistaGrafico === 'mes') {
                            label = new Date(periodo + '-01').toLocaleDateString('es-ES', { month: 'short', year: 'numeric' });
                          } else {
                            label = periodo;
                          }
                          
                          return {
                            periodo: label,
                            pagado: datos.pagado,
                            pendiente: datos.pendiente,
                            vencido: datos.vencido,
                            periodoOriginal: periodo,
                          };
                        })
                        .sort((a, b) => a.periodoOriginal.localeCompare(b.periodoOriginal));
                    })()}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="periodo" 
                      style={{ fontSize: '12px' }}
                      angle={vistaGrafico === 'dia' ? -45 : 0}
                      textAnchor={vistaGrafico === 'dia' ? 'end' : 'middle'}
                      height={vistaGrafico === 'dia' ? 80 : 30}
                    />
                    <YAxis 
                      style={{ fontSize: '12px' }}
                      tickFormatter={(value) => formatMoney(value, 0)}
                    />
                    <Tooltip 
                      formatter={(value: any) => formatMoney(value)}
                      contentStyle={{ backgroundColor: 'white', border: '1px solid #ccc', borderRadius: '8px' }}
                    />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="pagado" 
                      stroke="#10b981"
                      strokeWidth={3}
                      dot={{ fill: '#10b981', r: 4 }}
                      activeDot={{ r: 7 }}
                      name="Pagado"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="pendiente" 
                      stroke="#f59e0b"
                      strokeWidth={3}
                      dot={{ fill: '#f59e0b', r: 4 }}
                      activeDot={{ r: 7 }}
                      name="Pendiente"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="vencido" 
                      stroke="#ef4444"
                      strokeWidth={3}
                      dot={{ fill: '#ef4444', r: 4 }}
                      activeDot={{ r: 7 }}
                      name="Vencido"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-gray-200">
                <div className="text-center">
                  <p className="text-sm text-gray-600">
                    <i className="fa-solid fa-check-circle mr-1 text-green-600"></i>
                    Total Pagado
                  </p>
                  <p className="text-2xl font-bold text-green-600">
                    {formatMoney(creditos.reduce((total, c) => total + (c.cuotas?.filter((cu: any) => cu.pagado).reduce((sum: number, cu: any) => sum + cu.montoCuota, 0) || 0), 0))}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-600">
                    <i className="fa-solid fa-clock mr-1 text-yellow-600"></i>
                    Total Pendiente
                  </p>
                  <p className="text-2xl font-bold text-yellow-600">
                    {formatMoney(creditos.reduce((total, c) => {
                      const hoy = new Date();
                      return total + (c.cuotas?.filter((cu: any) => !cu.pagado && new Date(cu.fechaVencimiento) >= hoy).reduce((sum: number, cu: any) => sum + cu.montoCuota, 0) || 0);
                    }, 0))}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-600">
                    <i className="fa-solid fa-exclamation-circle mr-1 text-red-600"></i>
                    Total Vencido
                  </p>
                  <p className="text-2xl font-bold text-red-600">
                    {formatMoney(creditos.reduce((total, c) => {
                      const hoy = new Date();
                      return total + (c.cuotas?.filter((cu: any) => !cu.pagado && new Date(cu.fechaVencimiento) < hoy).reduce((sum: number, cu: any) => sum + cu.montoCuota, 0) || 0);
                    }, 0))}
                  </p>
                </div>
              </div>
              </div>
            )}

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-4 border-b border-gray-200 bg-gray-50">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Cliente</label>
                    <input
                      type="text"
                      placeholder="Buscar por cliente..."
                      value={clienteFilter}
                      onChange={(e) => setClienteFilter(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Estado</label>
                    <select 
                      value={estadoFilter}
                      onChange={(e) => setEstadoFilter(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Todos</option>
                      <option value="pagado">Pagado</option>
                      <option value="pendiente">Pendiente</option>
                      <option value="vencido">Vencido</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Fecha Desde</label>
                    <input
                      type="date"
                      value={fechaDesdeFilter}
                      onChange={(e) => setFechaDesdeFilter(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Fecha Hasta</label>
                    <input
                      type="date"
                      value={fechaHastaFilter}
                      onChange={(e) => setFechaHastaFilter(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>
              <div className="px-4 py-2 bg-blue-50 border-b border-blue-200 text-sm text-blue-700">
                <i className="fa-solid fa-info-circle mr-2"></i>
                Mostrando {
                  creditos.flatMap(credito => 
                    credito.cuotas?.filter((cuota: any) => {
                      const hoy = new Date();
                      const fechaVenc = new Date(cuota.fechaVencimiento);
                      const estaVencida = !cuota.pagado && fechaVenc < hoy;
                      const nombreCompleto = `${credito.cliente?.nombre || ''} ${credito.cliente?.apellido || ''}`.toLowerCase();
                      const cedula = (credito.cliente?.cedula || '').toLowerCase();
                      const busquedaCliente = clienteFilter.toLowerCase();
                      
                      if (clienteFilter && !nombreCompleto.includes(busquedaCliente) && !cedula.includes(busquedaCliente)) return false;
                      if (estadoFilter) {
                        if (estadoFilter === 'pagado' && !cuota.pagado) return false;
                        if (estadoFilter === 'vencido' && (!estaVencida || cuota.pagado)) return false;
                        if (estadoFilter === 'pendiente' && (cuota.pagado || estaVencida)) return false;
                      }
                      if (fechaDesdeFilter && fechaVenc < new Date(fechaDesdeFilter)) return false;
                      if (fechaHastaFilter) {
                        const fechaHasta = new Date(fechaHastaFilter);
                        fechaHasta.setHours(23, 59, 59, 999);
                        if (fechaVenc > fechaHasta) return false;
                      }
                      return true;
                    }) || []
                  ).length
                } cuota(s) de {
                  creditos.reduce((total, credito) => total + (credito.cuotas?.length || 0), 0)
                } totales
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Crédito
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Cliente
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Cuota #
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Monto Cuota
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Fecha Venc.
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Empresa
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Estado
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Fecha Pago
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {(() => {
                      // Filtrar cuotas
                      const cuotasFiltradas = creditos.flatMap(credito => 
                        credito.cuotas?.map((cuota: any) => ({...cuota, credito})).filter((cuota: any) => {
                          const hoy = new Date();
                          const fechaVenc = new Date(cuota.fechaVencimiento);
                          const estaVencida = !cuota.pagado && fechaVenc < hoy;
                          
                          const nombreCompleto = `${cuota.credito.cliente?.nombre || ''} ${cuota.credito.cliente?.apellido || ''}`.toLowerCase();
                          const cedula = (cuota.credito.cliente?.cedula || '').toLowerCase();
                          const busquedaCliente = clienteFilter.toLowerCase();
                          
                          if (clienteFilter && !nombreCompleto.includes(busquedaCliente) && !cedula.includes(busquedaCliente)) return false;
                          if (estadoFilter) {
                            if (estadoFilter === 'pagado' && !cuota.pagado) return false;
                            if (estadoFilter === 'vencido' && (!estaVencida || cuota.pagado)) return false;
                            if (estadoFilter === 'pendiente' && (cuota.pagado || estaVencida)) return false;
                          }
                          if (fechaDesdeFilter && fechaVenc < new Date(fechaDesdeFilter)) return false;
                          if (fechaHastaFilter) {
                            const fechaHasta = new Date(fechaHastaFilter);
                            fechaHasta.setHours(23, 59, 59, 999);
                            if (fechaVenc > fechaHasta) return false;
                          }
                          return true;
                        }) || []
                      );
                      
                      // Paginar
                      const inicio = (paginaCuotas - 1) * cuotasPorPagina;
                      const fin = inicio + cuotasPorPagina;
                      const cuotasPaginadas = cuotasFiltradas.slice(inicio, fin);
                      
                      return cuotasPaginadas.map((cuota: any) => {
                        const hoy = new Date();
                        const fechaVenc = new Date(cuota.fechaVencimiento);
                        const estaVencida = !cuota.pagado && fechaVenc < hoy;
                        
                        return (
                          <tr key={cuota.id} className={`hover:bg-gray-50 ${
                            estaVencida ? 'bg-red-50' : ''
                          }`}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {formatMoney(cuota.credito.monto)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">
                                {cuota.credito.cliente?.nombre} {cuota.credito.cliente?.apellido}
                              </div>
                              <div className="text-xs text-gray-500">
                                {cuota.credito.cliente?.cedula}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              <span className="font-semibold">{cuota.numeroCuota}</span> de {cuota.credito.plazoMeses}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                              {formatMoney(cuota.montoCuota)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              <div className={estaVencida ? 'text-red-600 font-semibold' : 'text-gray-900'}>
                                {new Date(cuota.fechaVencimiento).toLocaleDateString('es-ES')}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center space-x-2">
                                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: empresas.find(e => e.id === cuota.credito.empresaId)?.color || '#6b7280' }}></div>
                                <span className="text-sm text-gray-600">{empresas.find(e => e.id === cuota.credito.empresaId)?.nombre || 'N/A'}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {cuota.pagado ? (
                                <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                                  <i className="fa-solid fa-check-circle mr-1"></i>
                                  Pagado
                                </span>
                              ) : estaVencida ? (
                                <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                                  <i className="fa-solid fa-exclamation-circle mr-1"></i>
                                  Vencida
                                </span>
                              ) : (
                                <span className="px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
                                  <i className="fa-solid fa-clock mr-1"></i>
                                  Pendiente
                                </span>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {cuota.fechaPago 
                                ? new Date(cuota.fechaPago).toLocaleDateString('es-ES')
                                : '-'
                              }
                            </td>
                          </tr>
                        );
                      });
                    })()}
                    {creditos.every(c => !c.cuotas || c.cuotas.length === 0) && (
                      <tr>
                        <td colSpan={8} className="px-6 py-12 text-center">
                          <i className="fa-solid fa-list-check text-5xl text-gray-400 block mb-4"></i>
                          <p className="text-gray-600 mb-2">No hay cuotas registradas</p>
                          <a
                            href="/dashboard/creditos/nuevo"
                            className="inline-flex items-center text-blue-600 hover:text-blue-700"
                          >
                            <span>+</span>
                            <span className="ml-1">Crear primer crédito</span>
                          </a>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
                
                {/* Controles de paginación */}
                {(() => {
                  const cuotasFiltradas = creditos.flatMap(credito => 
                    credito.cuotas?.map((cuota: any) => ({...cuota, credito})).filter((cuota: any) => {
                      const hoy = new Date();
                      const fechaVenc = new Date(cuota.fechaVencimiento);
                      const estaVencida = !cuota.pagado && fechaVenc < hoy;
                      
                      const nombreCompleto = `${cuota.credito.cliente?.nombre || ''} ${cuota.credito.cliente?.apellido || ''}`.toLowerCase();
                      const cedula = (cuota.credito.cliente?.cedula || '').toLowerCase();
                      const busquedaCliente = clienteFilter.toLowerCase();
                      
                      if (clienteFilter && !nombreCompleto.includes(busquedaCliente) && !cedula.includes(busquedaCliente)) return false;
                      if (estadoFilter) {
                        if (estadoFilter === 'pagado' && !cuota.pagado) return false;
                        if (estadoFilter === 'vencido' && (!estaVencida || cuota.pagado)) return false;
                        if (estadoFilter === 'pendiente' && (cuota.pagado || estaVencida)) return false;
                      }
                      if (fechaDesdeFilter && fechaVenc < new Date(fechaDesdeFilter)) return false;
                      if (fechaHastaFilter) {
                        const fechaHasta = new Date(fechaHastaFilter);
                        fechaHasta.setHours(23, 59, 59, 999);
                        if (fechaVenc > fechaHasta) return false;
                      }
                      return true;
                    }) || []
                  );
                  
                  const totalPaginas = Math.ceil(cuotasFiltradas.length / cuotasPorPagina);
                  
                  if (totalPaginas <= 1) return null;
                  
                  return (
                    <div className="px-6 py-4 flex items-center justify-between border-t border-gray-200 bg-white">
                      <div className="flex-1 flex justify-between sm:hidden">
                        <button
                          onClick={() => setPaginaCuotas(Math.max(1, paginaCuotas - 1))}
                          disabled={paginaCuotas === 1}
                          className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Anterior
                        </button>
                        <button
                          onClick={() => setPaginaCuotas(Math.min(totalPaginas, paginaCuotas + 1))}
                          disabled={paginaCuotas === totalPaginas}
                          className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Siguiente
                        </button>
                      </div>
                      <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                        <div>
                          <p className="text-sm text-gray-700">
                            Mostrando <span className="font-medium">{((paginaCuotas - 1) * cuotasPorPagina) + 1}</span> a <span className="font-medium">{Math.min(paginaCuotas * cuotasPorPagina, cuotasFiltradas.length)}</span> de{' '}
                            <span className="font-medium">{cuotasFiltradas.length}</span> cuotas
                          </p>
                        </div>
                        <div>
                          <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Paginación">
                            <button
                              onClick={() => setPaginaCuotas(Math.max(1, paginaCuotas - 1))}
                              disabled={paginaCuotas === 1}
                              className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <span className="sr-only">Anterior</span>
                              <i className="fas fa-chevron-left"></i>
                            </button>
                            {[...Array(totalPaginas)].map((_, i) => {
                              const pagina = i + 1;
                              // Mostrar solo algunas páginas alrededor de la actual
                              if (
                                pagina === 1 ||
                                pagina === totalPaginas ||
                                (pagina >= paginaCuotas - 1 && pagina <= paginaCuotas + 1)
                              ) {
                                return (
                                  <button
                                    key={pagina}
                                    onClick={() => setPaginaCuotas(pagina)}
                                    className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                                      pagina === paginaCuotas
                                        ? 'z-10 bg-indigo-50 border-indigo-500 text-indigo-600'
                                        : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                                    }`}
                                  >
                                    {pagina}
                                  </button>
                                );
                              } else if (
                                pagina === paginaCuotas - 2 ||
                                pagina === paginaCuotas + 2
                              ) {
                                return (
                                  <span
                                    key={pagina}
                                    className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700"
                                  >
                                    ...
                                  </span>
                                );
                              }
                              return null;
                            })}
                            <button
                              onClick={() => setPaginaCuotas(Math.min(totalPaginas, paginaCuotas + 1))}
                              disabled={paginaCuotas === totalPaginas}
                              className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <span className="sr-only">Siguiente</span>
                              <i className="fas fa-chevron-right"></i>
                            </button>
                          </nav>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>
        )}

        {/* Empresas Tab */}
        {activeTab === 'empresas' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Lista de Empresas</h3>
                <p className="text-sm text-gray-500">Administra las empresas del sistema</p>
              </div>
              <a
                href="/dashboard/empresas/nuevo"
                className="flex items-center space-x-2 text-white px-4 py-2 rounded-lg font-medium transition-all shadow-sm hover:shadow-md hover:scale-105"
                style={{ backgroundColor: user?.empresaActiva?.color || '#2563eb' }}
              >
                <span>+</span>
                <span>Nueva Empresa</span>
              </a>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {empresas.map((empresa) => {
                const isActive = user?.empresaActivaId === empresa.id;
                const borderColor = isActive ? empresa.color : '#e5e7eb';
                const ringColor = isActive ? `${empresa.color}33` : 'transparent';
                
                return (
                <div
                  key={empresa.id}
                  className="relative bg-white shadow-sm rounded-xl p-6 border-2 hover:shadow-md transition-all"
                  style={{
                    borderColor: borderColor,
                    boxShadow: isActive ? `0 0 0 3px ${ringColor}` : undefined
                  }}
                >
                  {user?.empresaActivaId === empresa.id && (
                    <div 
                      className="absolute top-4 right-4 text-white text-xs font-bold px-2 py-1 rounded-full"
                      style={{ backgroundColor: empresa.color }}
                    >
                      ACTIVA
                    </div>
                  )}
                  <div className="flex items-start space-x-4">
                    <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden border-2 border-gray-200">
                      {empresa.logo ? (
                        <img src={empresa.logo} alt={empresa.nombre} className="w-full h-full object-cover" />
                      ) : (
                        <i className="fa-solid fa-building text-3xl text-gray-400"></i>
                      )}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900">{empresa.nombre}</h4>
                      <div className="mt-2 space-y-1">
                        <div className="flex items-center text-sm text-gray-600">
                          <i className="fa-solid fa-coins mr-2"></i>
                          <span>Moneda: {empresa.moneda}</span>
                        </div>
                        <div className="flex items-center text-sm text-gray-600">
                          <span className="mr-2">🎨</span>
                          <span>Color:</span>
                          <div
                            className="ml-2 w-6 h-6 rounded border border-gray-300"
                            style={{ backgroundColor: empresa.color }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t border-gray-200 flex justify-between items-center">
                    {user?.empresaActivaId !== empresa.id && (
                      <button
                        onClick={() => handleActivarEmpresa(empresa.id)}
                        className="px-3 py-1 text-sm text-green-600 hover:bg-green-50 rounded transition-colors font-medium"
                      >
                        Activar
                      </button>
                    )}
                    {user?.empresaActivaId === empresa.id && (
                      <div className="text-sm text-green-600 font-medium">
                        ✓ En uso
                      </div>
                    )}
                    <div className="flex space-x-2">
                      <button
                        onClick={() => router.push(`/dashboard/empresas/${empresa.id}/editar`)}
                        className="px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded transition-colors"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleDeleteEmpresa(empresa.id, empresa.nombre)}
                        className="px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded transition-colors"
                      >
                        Eliminar
                      </button>
                    </div>
                  </div>
                </div>
                );
              })}
              {empresas.length === 0 && (
                <div className="col-span-full text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                  <i className="fa-solid fa-building text-5xl text-gray-400 block mb-4"></i>
                  <p className="text-gray-600 mb-2">No hay empresas registradas</p>
                  <a
                    href="/dashboard/empresas/nuevo"
                    className="inline-flex items-center text-blue-600 hover:text-blue-700"
                  >
                    <span>+</span>
                    <span className="ml-1">Crear primera empresa</span>
                  </a>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Usuarios Tab */}
        {activeTab === 'usuarios' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Lista de Usuarios</h3>
                <p className="text-sm text-gray-500">Administra los usuarios del sistema</p>
              </div>
              <a
                href="/dashboard/usuarios/nuevo"
                className="flex items-center space-x-2 text-white px-4 py-2 rounded-lg font-medium transition-all shadow-sm hover:shadow-md hover:scale-105"
                style={{ backgroundColor: user?.empresaActiva?.color || '#2563eb' }}
              >
                <span>+</span>
                <span>Nuevo Usuario</span>
              </a>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Usuario
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Empresa Activa
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Fecha Registro
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {usuarios.map((usuario) => (
                    <tr key={usuario.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div 
                            className="h-10 w-10 rounded-full flex items-center justify-center overflow-hidden"
                            style={{ backgroundColor: user?.empresaActiva?.color || '#2563eb' }}
                          >
                            {usuario.profileImage ? (
                              <img src={usuario.profileImage} alt={usuario.name} className="h-full w-full object-cover" />
                            ) : (
                              <i className="fa-solid fa-user text-white"></i>
                            )}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{usuario.name}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{usuario.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {usuario.empresaActiva ? usuario.empresaActiva.nombre : 'Sin empresa'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(usuario.createdAt).toLocaleDateString('es-ES')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end space-x-2">
                          <button
                            onClick={() => router.push(`/dashboard/usuarios/${usuario.id}/editar`)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            Editar
                          </button>
                          <button
                            onClick={() => handleDeleteUsuario(usuario.id, usuario.name)}
                            className="text-red-600 hover:text-red-900"
                          >
                            Eliminar
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {usuarios.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center">
                        <i className="fa-solid fa-users text-5xl text-gray-400 block mb-4"></i>
                        <p className="text-gray-600 mb-2">No hay usuarios registrados</p>
                        <a
                          href="/dashboard/usuarios/nuevo"
                          className="inline-flex items-center text-blue-600 hover:text-blue-700"
                        >
                          <span>+</span>
                          <span className="ml-1">Crear primer usuario</span>
                        </a>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Configuracion Creditos Tab */}
        {activeTab === 'configuracion-creditos' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Configuración de Créditos</h3>
                <p className="text-sm text-gray-500">Administra las configuraciones de cálculo de créditos</p>
              </div>
              <a
                href="/dashboard/configuracion-creditos/nuevo"
                className="flex items-center space-x-2 text-white px-4 py-2 rounded-lg font-medium transition-all shadow-sm hover:shadow-md hover:scale-105"
                style={{ backgroundColor: user?.empresaActiva?.color || '#2563eb' }}
              >
                <span>+</span>
                <span>Nueva Configuración</span>
              </a>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Nombre
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Interés Anual
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tipo de Cálculo
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Fecha Creación
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {configuraciones.map((config: any) => (
                    <tr key={config.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{config.nombre}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{config.interesAnual}%</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                          {config.tipoCalculo}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(config.createdAt).toLocaleDateString('es-ES')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end space-x-2">
                          <button
                            onClick={() => router.push(`/dashboard/configuracion-creditos/${config.id}/editar`)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            Editar
                          </button>
                          <button
                            onClick={() => handleDeleteConfiguracion(config.id, config.nombre)}
                            className="text-red-600 hover:text-red-900"
                          >
                            Eliminar
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {configuraciones.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center">
                        <i className="fa-solid fa-gear text-5xl text-gray-400 block mb-4"></i>
                        <p className="text-gray-600 mb-2">No hay configuraciones registradas</p>
                        <a
                          href="/dashboard/configuracion-creditos/nuevo"
                          className="inline-flex items-center text-blue-600 hover:text-blue-700"
                        >
                          <span>+</span>
                          <span className="ml-1">Crear primera configuración</span>
                        </a>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Perfil Tab */}
        {activeTab === 'perfil' && (
          <div className="space-y-6">
            {/* Imagen de Perfil */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Foto de Perfil</h3>
              <div className="flex items-center space-x-6">
                <div className="w-24 h-24 bg-blue-500 rounded-full flex items-center justify-center overflow-hidden">
                  {user?.profileImage ? (
                    <img src={user.profileImage} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <i className="fa-solid fa-user text-4xl text-white"></i>
                  )}
                </div>
                <div className="flex-1">
                  <label className="cursor-pointer inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                    <i className="fa-solid fa-camera mr-2"></i>
                    <span>{imageUploading ? 'Subiendo...' : 'Cambiar Foto'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      disabled={imageUploading}
                      className="hidden"
                    />
                  </label>
                  <p className="text-xs text-gray-500 mt-2">JPG, PNG o GIF (máx. 5MB)</p>
                </div>
              </div>
            </div>

            {/* Información del Usuario */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Información Personal</h3>
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
            </div>

            {/* Cambiar Contraseña */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Seguridad</h3>
              <button
                onClick={() => setShowPasswordModal(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <i className="fa-solid fa-lock"></i>
                <span>Cambiar Contraseña</span>
              </button>
            </div>
          </div>
        )}

        {/* Modal de Cambiar Contraseña */}
        {showPasswordModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-900">Cambiar Contraseña</h3>
                <button
                  onClick={() => {
                    setShowPasswordModal(false);
                    setPasswordError('');
                    setPasswordSuccess('');
                    setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              {passwordError && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                  {passwordError}
                </div>
              )}

              {passwordSuccess && (
                <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
                  {passwordSuccess}
                </div>
              )}

              <form onSubmit={handlePasswordChange} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Contraseña Actual *
                  </label>
                  <input
                    type="password"
                    required
                    value={passwordForm.currentPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nueva Contraseña *
                  </label>
                  <input
                    type="password"
                    required
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    minLength={6}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Confirmar Nueva Contraseña *
                  </label>
                  <input
                    type="password"
                    required
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    minLength={6}
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowPasswordModal(false);
                      setPasswordError('');
                      setPasswordSuccess('');
                      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Actualizar Contraseña
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </>
  );
}
