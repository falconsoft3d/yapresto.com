'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function NuevoCreditoPage() {
  const router = useRouter();
  const [clientes, setClientes] = useState<any[]>([]);
  const [configuraciones, setConfiguraciones] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    clienteId: '',
    monto: '',
    configuracionCreditoId: '',
    plazoMeses: '',
    fechaInicio: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadClientes();
    loadConfiguraciones();
  }, []);

  const loadClientes = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/clientes', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (res.ok) {
        const data = await res.json();
        setClientes(data);
      }
    } catch (error) {
      console.error('Error al cargar clientes:', error);
    }
  };

  const loadConfiguraciones = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/configuracion-creditos', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (res.ok) {
        const data = await res.json();
        setConfiguraciones(data);
      }
    } catch (error) {
      console.error('Error al cargar configuraciones:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/creditos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          clienteId: formData.clienteId,
          monto: parseFloat(formData.monto),
          configuracionCreditoId: formData.configuracionCreditoId,
          plazoMeses: parseInt(formData.plazoMeses),
          fechaInicio: formData.fechaInicio || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Error al crear crédito');
      }

      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Nuevo Crédito</h2>
            <p className="text-sm text-gray-500 mt-1">Registra un nuevo crédito en el sistema</p>
          </div>
          <button
            onClick={() => router.push('/dashboard')}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <span>←</span>
            <span>Volver</span>
          </button>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 overflow-y-auto p-6">
        <div className="max-w-3xl mx-auto">
          <div className="bg-white shadow-sm rounded-xl p-8 border border-gray-200">
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cliente *
                </label>
                <select
                  required
                  value={formData.clienteId}
                  onChange={(e) => setFormData({ ...formData, clienteId: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Seleccione un cliente</option>
                  {clientes.map((cliente) => (
                    <option key={cliente.id} value={cliente.id}>
                      {cliente.nombre} {cliente.apellido} - {cliente.cedula}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Configuración de Crédito *
                </label>
                <select
                  required
                  value={formData.configuracionCreditoId}
                  onChange={(e) => setFormData({ ...formData, configuracionCreditoId: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Seleccione una configuración</option>
                  {configuraciones.map((config) => (
                    <option key={config.id} value={config.id}>
                      {config.nombre} - {config.interesAnual}% anual ({config.tipoCalculo})
                    </option>
                  ))}
                </select>
                <p className="text-sm text-gray-500 mt-1">
                  La tasa de interés y tipo de cálculo se tomarán de la configuración seleccionada
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Monto ($) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formData.monto}
                    onChange={(e) => setFormData({ ...formData, monto: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="10000"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Plazo (meses) *
                  </label>
                  <input
                    type="number"
                    required
                    value={formData.plazoMeses}
                    onChange={(e) => setFormData({ ...formData, plazoMeses: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="12"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fecha de Inicio
                  </label>
                  <input
                    type="date"
                    value={formData.fechaInicio}
                    onChange={(e) => setFormData({ ...formData, fechaInicio: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Dejar vacío para usar hoy
                  </p>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  <strong>Nota:</strong> Las cuotas se calcularán automáticamente según la configuración seleccionada usando el sistema de amortización correspondiente (Francés, Alemán o Americano).
                </p>
              </div>

              <div className="flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={() => router.push('/dashboard')}
                  className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? 'Guardando...' : 'Crear Crédito'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </>
  );
}
