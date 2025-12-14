'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { formatCurrency, getCurrencySymbol } from '@/lib/currency';

export default function NuevaEvaluacionPage() {
  const router = useRouter();
  const [clientes, setClientes] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);
  const [empresa, setEmpresa] = useState<any>(null);

  // Obtener moneda de la empresa
  const monedaEmpresa = empresa?.moneda || 'USD';
  const simboloMoneda = getCurrencySymbol(monedaEmpresa);
  const formatMoney = (amount: number, decimals = 2) => formatCurrency(amount, monedaEmpresa, { decimals });

  const [formData, setFormData] = useState({
    clienteId: '',
    ingresosMensuales: '',
    gastosMensuales: '',
    porcentajeEndeudamiento: '40',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);
      // Cargar empresa activa
      if (parsedUser.empresaActivaId) {
        loadEmpresa(parsedUser.empresaActivaId);
      }
    }
    loadClientes();
  }, []);

  const loadEmpresa = async (empresaId: string) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/empresas/${empresaId}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (res.ok) {
        setEmpresa(await res.json());
      }
    } catch (error) {
      console.error('Error al cargar empresa:', error);
    }
  };

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

  const calcularResultados = () => {
    const ingresos = parseFloat(formData.ingresosMensuales) || 0;
    const gastos = parseFloat(formData.gastosMensuales) || 0;
    const porcentaje = parseFloat(formData.porcentajeEndeudamiento) || 40;

    const ingresoDisponible = ingresos - gastos;
    const capacidadEndeudamiento = ingresoDisponible * (porcentaje / 100);

    return {
      ingresoDisponible,
      capacidadEndeudamiento,
      porcentajeDisponible: ingresos > 0 ? ((ingresoDisponible / ingresos) * 100).toFixed(1) : 0,
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/evaluaciones', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          clienteId: formData.clienteId,
          ingresosMensuales: parseFloat(formData.ingresosMensuales),
          gastosMensuales: parseFloat(formData.gastosMensuales),
          porcentajeEndeudamiento: parseFloat(formData.porcentajeEndeudamiento),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Error al crear evaluación');
      }

      router.push('/dashboard?tab=evaluacion');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const resultados = calcularResultados();

  return (
    <>
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Nueva Evaluación Crediticia</h2>
            <p className="text-sm text-gray-500 mt-1">Evalúa la capacidad de endeudamiento del cliente</p>
          </div>
          <button
            onClick={() => router.push('/dashboard?tab=evaluacion')}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <span>←</span>
            <span>Volver</span>
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-6">
        <div className="max-w-4xl mx-auto">
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <i className="fa-solid fa-dollar-sign mr-2 text-green-600"></i>
                    Ingresos Mensuales ({simboloMoneda}) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formData.ingresosMensuales}
                    onChange={(e) => setFormData({ ...formData, ingresosMensuales: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <i className="fa-solid fa-receipt mr-2 text-red-600"></i>
                    Gastos Mensuales ({simboloMoneda}) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formData.gastosMensuales}
                    onChange={(e) => setFormData({ ...formData, gastosMensuales: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <i className="fa-solid fa-percent mr-2 text-blue-600"></i>
                  Porcentaje de Endeudamiento (%) *
                </label>
                <div className="flex items-center space-x-4">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="5"
                    value={formData.porcentajeEndeudamiento}
                    onChange={(e) => setFormData({ ...formData, porcentajeEndeudamiento: e.target.value })}
                    className="flex-1"
                  />
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={formData.porcentajeEndeudamiento}
                    onChange={(e) => setFormData({ ...formData, porcentajeEndeudamiento: e.target.value })}
                    className="w-20 px-3 py-2 border border-gray-300 rounded-lg text-center focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <span className="text-gray-600">%</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Porcentaje del ingreso disponible que puede destinarse al pago de deudas
                </p>
              </div>

              {formData.ingresosMensuales && formData.gastosMensuales && (
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200 rounded-xl p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                    <i className="fa-solid fa-chart-pie mr-2 text-blue-600"></i>
                    Análisis de Capacidad Crediticia
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white rounded-lg p-4 shadow-sm">
                      <p className="text-sm text-gray-600 mb-1">Ingreso Disponible</p>
                      <p className="text-2xl font-bold text-blue-600">
                        {formatMoney(resultados.ingresoDisponible)}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {resultados.porcentajeDisponible}% de ingresos
                      </p>
                    </div>
                    <div className="bg-white rounded-lg p-4 shadow-sm">
                      <p className="text-sm text-gray-600 mb-1">Capacidad de Endeudamiento</p>
                      <p className="text-2xl font-bold text-green-600">
                        {formatMoney(resultados.capacidadEndeudamiento)}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Cuota máxima mensual
                      </p>
                    </div>
                    <div className="bg-white rounded-lg p-4 shadow-sm">
                      <p className="text-sm text-gray-600 mb-1">Monto Máximo Crédito</p>
                      <p className="text-2xl font-bold text-purple-600">
                        {formatMoney(resultados.capacidadEndeudamiento * 12)}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Estimado a 12 meses
                      </p>
                    </div>
                  </div>
                  {parseFloat(formData.gastosMensuales) >= parseFloat(formData.ingresosMensuales) && (
                    <div className="mt-4 bg-red-100 border border-red-300 text-red-700 px-4 py-3 rounded-lg flex items-center">
                      <i className="fa-solid fa-exclamation-triangle mr-2"></i>
                      <span>⚠️ Los gastos igualan o superan los ingresos. No hay capacidad de endeudamiento.</span>
                    </div>
                  )}
                </div>
              )}

              <div className="flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={() => router.push('/dashboard?tab=evaluacion')}
                  className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading || !formData.clienteId}
                  className="px-6 py-2 text-white rounded-lg font-medium transition-all shadow-sm hover:shadow-md hover:scale-105 disabled:opacity-50"
                  style={{ backgroundColor: user?.empresaActiva?.color || '#2563eb' }}
                >
                  {loading ? 'Guardando...' : 'Guardar Evaluación'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </>
  );
}
