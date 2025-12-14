'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function NuevoPagoPage() {
  const router = useRouter();
  const [creditos, setCreditos] = useState<any[]>([]);
  const [creditoSeleccionado, setCreditoSeleccionado] = useState<any>(null);
  const [cuotasDisponibles, setCuotasDisponibles] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);
  const [formData, setFormData] = useState({
    creditoId: '',
    monto: '',
    metodoPago: 'efectivo',
    fechaPago: new Date().toISOString().split('T')[0],
    tipoPago: 'cuotas', // cuotas o aporte_capital
  });
  const [cuotasACubrir, setCuotasACubrir] = useState<number>(1);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
    loadCreditos();
  }, []);

  useEffect(() => {
    if (formData.creditoId) {
      const credito = creditos.find(c => c.id === formData.creditoId);
      setCreditoSeleccionado(credito);
      if (credito) {
        const cuotasPendientes = credito.cuotas?.filter((c: any) => !c.pagado) || [];
        setCuotasDisponibles(cuotasPendientes);
      }
    } else {
      setCreditoSeleccionado(null);
      setCuotasDisponibles([]);
    }
  }, [formData.creditoId, creditos]);

  useEffect(() => {
    if (formData.tipoPago === 'cuotas' && formData.monto && cuotasDisponibles.length > 0) {
      const monto = parseFloat(formData.monto);
      let montoRestante = monto;
      let cuotasCubiertas = 0;

      for (const cuota of cuotasDisponibles) {
        if (montoRestante >= cuota.montoCuota) {
          montoRestante -= cuota.montoCuota;
          cuotasCubiertas++;
        } else {
          break;
        }
      }

      setCuotasACubrir(cuotasCubiertas || 1);
    } else if (formData.tipoPago === 'aporte_capital') {
      setCuotasACubrir(0);
    }
  }, [formData.monto, formData.tipoPago, cuotasDisponibles]);

  const loadCreditos = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/creditos', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (res.ok) {
        const data = await res.json();
        // Filtrar solo créditos validados o activos
        const creditosActivos = data.filter((c: any) => 
          c.estado === 'validado' || c.estado === 'activo'
        );
        setCreditos(creditosActivos);
      }
    } catch (error) {
      console.error('Error al cargar créditos:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/pagos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          creditoId: formData.creditoId,
          monto: parseFloat(formData.monto),
          metodoPago: formData.metodoPago,
          fechaPago: formData.fechaPago,
          tipoPago: formData.tipoPago,
          cuotasACubrir: cuotasACubrir,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Error al registrar pago');
      }

      router.push('/dashboard?tab=pagos');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const calcularTotalCuotas = () => {
    return cuotasDisponibles
      .slice(0, cuotasACubrir)
      .reduce((sum, c) => sum + c.montoCuota, 0);
  };

  return (
    <>
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Registrar Pago</h2>
            <p className="text-sm text-gray-500 mt-1">
              {formData.tipoPago === 'cuotas' ? 'Registra un pago de cuotas de crédito' : 'Realiza un aporte directo al capital del crédito'}
            </p>
          </div>
          <button
            onClick={() => router.push('/dashboard?tab=pagos')}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <span>←</span>
            <span>Volver</span>
          </button>
        </div>
      </header>

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
                  Crédito *
                </label>
                <select
                  required
                  value={formData.creditoId}
                  onChange={(e) => setFormData({ ...formData, creditoId: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Seleccione un crédito</option>
                  {creditos.map((credito) => (
                    <option key={credito.id} value={credito.id}>
                      {credito.cliente?.nombre} {credito.cliente?.apellido} - ${credito.monto.toLocaleString()} ({credito.estado})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo de Pago *
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, tipoPago: 'cuotas' })}
                    className={`px-4 py-3 border-2 rounded-lg text-left transition-all ${
                      formData.tipoPago === 'cuotas'
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <i className="fa-solid fa-calendar-check text-lg"></i>
                      <div>
                        <div className="font-semibold">Pago de Cuotas</div>
                        <div className="text-xs text-gray-600">Paga las cuotas programadas</div>
                      </div>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, tipoPago: 'aporte_capital' })}
                    className={`px-4 py-3 border-2 rounded-lg text-left transition-all ${
                      formData.tipoPago === 'aporte_capital'
                        ? 'border-green-500 bg-green-50'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <i className="fa-solid fa-piggy-bank text-lg"></i>
                      <div>
                        <div className="font-semibold">Aporte a Capital</div>
                        <div className="text-xs text-gray-600">Reduce el saldo y recalcula cuotas</div>
                      </div>
                    </div>
                  </button>
                </div>
              </div>

              {creditoSeleccionado && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-semibold text-blue-900 mb-2">Información del Crédito</h4>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-blue-700">Monto total:</span>
                      <span className="font-semibold ml-2">${creditoSeleccionado.monto.toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="text-blue-700">Cuota mensual:</span>
                      <span className="font-semibold ml-2">${creditoSeleccionado.cuotaMensual.toFixed(2)}</span>
                    </div>
                    <div>
                      <span className="text-blue-700">Cuotas pendientes:</span>
                      <span className="font-semibold ml-2">{cuotasDisponibles.length} de {creditoSeleccionado.plazoMeses}</span>
                    </div>
                    <div>
                      <span className="text-blue-700">Saldo pendiente:</span>
                      <span className="font-semibold ml-2">
                        ${cuotasDisponibles.reduce((sum: number, c: any) => sum + c.montoCuota, 0).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Monto a Pagar ($) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formData.monto}
                    onChange={(e) => setFormData({ ...formData, monto: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="0.00"
                    disabled={!formData.creditoId}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Método de Pago *
                  </label>
                  <select
                    required
                    value={formData.metodoPago}
                    onChange={(e) => setFormData({ ...formData, metodoPago: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="efectivo">Efectivo</option>
                    <option value="transferencia">Transferencia</option>
                    <option value="tarjeta">Tarjeta</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fecha de Pago *
                </label>
                <input
                  type="date"
                  required
                  value={formData.fechaPago}
                  onChange={(e) => setFormData({ ...formData, fechaPago: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {formData.tipoPago === 'cuotas' && formData.monto && cuotasDisponibles.length > 0 && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h4 className="font-semibold text-green-900 mb-3">Cuotas a Cubrir</h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-green-700">Número de cuotas:</span>
                      <input
                        type="number"
                        min="1"
                        max={cuotasDisponibles.length}
                        value={cuotasACubrir}
                        onChange={(e) => setCuotasACubrir(parseInt(e.target.value) || 1)}
                        className="w-20 px-2 py-1 border border-green-300 rounded text-center"
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-green-700">Total a cubrir:</span>
                      <span className="font-bold text-lg">${calcularTotalCuotas().toFixed(2)}</span>
                    </div>
                    {parseFloat(formData.monto) < calcularTotalCuotas() && (
                      <p className="text-sm text-orange-600">
                        ⚠️ El monto es insuficiente para cubrir {cuotasACubrir} cuota(s)
                      </p>
                    )}
                  </div>
                </div>
              )}

              {formData.tipoPago === 'aporte_capital' && formData.monto && creditoSeleccionado && (
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <h4 className="font-semibold text-purple-900 mb-3">
                    <i className="fa-solid fa-calculator mr-2"></i>
                    Impacto del Aporte a Capital
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-purple-700">Monto del aporte:</span>
                      <span className="font-bold text-lg">${parseFloat(formData.monto || '0').toLocaleString()}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-purple-700">Saldo actual:</span>
                      <span className="font-semibold">
                        ${(creditoSeleccionado.monto - creditoSeleccionado.montoPagado).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-purple-700">Nuevo saldo:</span>
                      <span className="font-semibold text-green-600">
                        ${Math.max(0, creditoSeleccionado.monto - creditoSeleccionado.montoPagado - parseFloat(formData.monto || '0')).toLocaleString()}
                      </span>
                    </div>
                    <div className="mt-3 pt-3 border-t border-purple-200">
                      <p className="text-purple-700 text-xs">
                        <i className="fa-solid fa-info-circle mr-1"></i>
                        Las cuotas pendientes se recalcularán automáticamente con el nuevo saldo.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={() => router.push('/dashboard?tab=pagos')}
                  className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading || !formData.creditoId}
                  className="px-6 py-2 text-white rounded-lg font-medium transition-all shadow-sm hover:shadow-md hover:scale-105 disabled:opacity-50"
                  style={{ backgroundColor: user?.empresaActiva?.color || '#2563eb' }}
                >
                  {loading ? 'Registrando...' : 'Registrar Pago'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </>
  );
}
