'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { formatCurrency, getCurrencySymbol } from '@/lib/currency';

export default function EditarClientePage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [mostrarPassword, setMostrarPassword] = useState(false);
  const [ultimaEvaluacion, setUltimaEvaluacion] = useState<any>(null);
  const [empresa, setEmpresa] = useState<any>(null);
  const monedaEmpresa = empresa?.moneda || 'USD';
  const formatMoney = (amount: number, decimals = 2) => formatCurrency(amount, monedaEmpresa, { decimals });
  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    email: '',
    telefono: '',
    direccion: '',
    cedula: '',
    fechaNacimiento: '',
    password: '',
  });

  const generarPassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%';
    let password = '';
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData({ ...formData, password });
  };

  useEffect(() => {
    loadCliente();
    loadUltimaEvaluacion();
    loadEmpresa();
  }, []);

  const loadEmpresa = async () => {
    try {
      const token = localStorage.getItem('token');
      const userStr = localStorage.getItem('user');
      if (!userStr) return;
      
      const user = JSON.parse(userStr);
      const res = await fetch(`/api/empresas/${user.empresaActivaId}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      
      if (res.ok) {
        setEmpresa(await res.json());
      }
    } catch (err) {
      console.error('Error al cargar empresa:', err);
    }
  };

  const loadUltimaEvaluacion = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/evaluaciones?clienteId=${params.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (res.ok) {
        const evaluaciones = await res.json();
        if (evaluaciones.length > 0) {
          setUltimaEvaluacion(evaluaciones[0]); // Ya viene ordenado por createdAt desc
        }
      }
    } catch (err) {
      console.error('Error al cargar evaluación:', err);
    }
  };

  const loadCliente = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/clientes/${params.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        throw new Error('Error al cargar cliente');
      }

      const cliente = await res.json();
      setFormData({
        nombre: cliente.nombre,
        apellido: cliente.apellido,
        email: cliente.email,
        telefono: cliente.telefono,
        direccion: cliente.direccion,
        cedula: cliente.cedula,
        fechaNacimiento: cliente.fechaNacimiento ? new Date(cliente.fechaNacimiento).toISOString().split('T')[0] : '',
        password: cliente.password || '',
      });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSaving(true);

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/clientes/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Error al actualizar cliente');
      }

      router.push('/dashboard?tab=clientes');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-xl font-semibold text-gray-600">Cargando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen max-h-screen bg-gray-100 overflow-y-auto">
      <div className="max-w-4xl mx-auto py-8 px-4 pb-20">
        <div className="mb-6">
          <button
            onClick={() => router.back()}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <span className="mr-2">←</span>
            <span>Volver</span>
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Editar Cliente</h1>
          <p className="text-gray-500 mt-1">Modifica la información del cliente</p>
        </div>

        {/* Panel de Última Evaluación */}
        {ultimaEvaluacion && (
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200 rounded-xl p-6 mb-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-gray-900 flex items-center">
                <i className="fa-solid fa-chart-pie mr-2 text-blue-600"></i>
                Última Evaluación Crediticia
              </h2>
              <span className="text-xs text-gray-500">
                {new Date(ultimaEvaluacion.createdAt).toLocaleDateString('es-ES', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <p className="text-xs text-gray-600 mb-1">Ingresos Mensuales</p>
                <p className="text-xl font-bold text-green-600">
                  {formatMoney(ultimaEvaluacion.ingresosMensuales)}
                </p>
              </div>
              
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <p className="text-xs text-gray-600 mb-1">Gastos Mensuales</p>
                <p className="text-xl font-bold text-red-600">
                  {formatMoney(ultimaEvaluacion.gastosMensuales)}
                </p>
              </div>
              
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <p className="text-xs text-gray-600 mb-1">Capacidad de Endeudamiento</p>
                <p className="text-xl font-bold text-blue-600">
                  {formatMoney(ultimaEvaluacion.capacidadEndeudamiento)}
                </p>
                <p className="text-xs text-gray-500 mt-1">Cuota máxima mensual</p>
              </div>
              
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <p className="text-xs text-gray-600 mb-1">Monto Máximo Crédito</p>
                <p className="text-xl font-bold text-purple-600">
                  {formatMoney(ultimaEvaluacion.capacidadEndeudamiento * 12)}
                </p>
                <p className="text-xs text-gray-500 mt-1">Estimado a 12 meses</p>
              </div>
            </div>
            
            <div className="mt-4 flex items-center justify-between">
              <div className="flex items-center text-sm">
                <span className="text-gray-600 mr-2">Porcentaje de endeudamiento:</span>
                <span className="font-bold text-gray-900">{ultimaEvaluacion.porcentajeEndeudamiento}%</span>
              </div>
              <a
                href="/dashboard/evaluacion/nuevo"
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                + Nueva evaluación
              </a>
            </div>
          </div>
        )}

        {!ultimaEvaluacion && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6 flex items-center justify-between">
            <div className="flex items-center">
              <i className="fa-solid fa-info-circle text-yellow-600 mr-3 text-xl"></i>
              <span className="text-sm text-yellow-800">
                Este cliente no tiene una evaluación crediticia registrada
              </span>
            </div>
            <a
              href="/dashboard/evaluacion/nuevo"
              className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 text-sm font-medium transition-colors"
            >
              Crear evaluación
            </a>
          </div>
        )}

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre *
                </label>
                <input
                  type="text"
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Apellido *
                </label>
                <input
                  type="text"
                  value={formData.apellido}
                  onChange={(e) => setFormData({ ...formData, apellido: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cédula *
                </label>
                <input
                  type="text"
                  value={formData.cedula}
                  onChange={(e) => setFormData({ ...formData, cedula: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fecha de Nacimiento *
                </label>
                <input
                  type="date"
                  value={formData.fechaNacimiento}
                  onChange={(e) => setFormData({ ...formData, fechaNacimiento: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email *
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Teléfono *
                </label>
                <input
                  type="tel"
                  value={formData.telefono}
                  onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Dirección *
              </label>
              <textarea
                value={formData.direccion}
                onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={3}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Contraseña (Opcional)
              </label>
              <div className="flex space-x-2">
                <div className="flex-1 relative">
                  <input
                    type={mostrarPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="Contraseña para acceso del cliente"
                    className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <button
                    type="button"
                    onClick={() => setMostrarPassword(!mostrarPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    title={mostrarPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                  >
                    <i className={`fa-solid ${mostrarPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                  </button>
                </div>
                <button
                  type="button"
                  onClick={generarPassword}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors whitespace-nowrap"
                  title="Generar contraseña aleatoria"
                >
                  <i className="fa-solid fa-key mr-2"></i>
                  Generar
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Genera una contraseña segura o déjala en blanco para no cambiarla
              </p>
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={() => router.back()}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors disabled:opacity-50"
              >
                {saving ? 'Guardando...' : 'Guardar Cambios'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
