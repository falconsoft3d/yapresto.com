'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';

export default function EditarCreditoPage() {
  const router = useRouter();
  const params = useParams();
  const [clientes, setClientes] = useState<any[]>([]);
  const [configuraciones, setConfiguraciones] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    clienteId: '',
    monto: '',
    configuracionCreditoId: '',
    plazoMeses: '',
    fechaInicio: '',
    estado: 'borrador',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const token = localStorage.getItem('token');
      
      const [creditoRes, clientesRes, configuracionesRes] = await Promise.all([
        fetch(`/api/creditos/${params.id}`, {
          headers: { 'Authorization': `Bearer ${token}` },
        }),
        fetch('/api/clientes', {
          headers: { 'Authorization': `Bearer ${token}` },
        }),
        fetch('/api/configuracion-creditos', {
          headers: { 'Authorization': `Bearer ${token}` },
        }),
      ]);

      if (creditoRes.ok) {
        const credito = await creditoRes.json();
        const fechaInicio = new Date(credito.fechaInicio);
        const fechaFormateada = fechaInicio.toISOString().split('T')[0];
        
        setFormData({
          clienteId: credito.clienteId,
          monto: credito.monto.toString(),
          configuracionCreditoId: credito.configuracionCreditoId,
          plazoMeses: credito.plazoMeses.toString(),
          fechaInicio: fechaFormateada,
          estado: credito.estado,
        });
      }

      if (clientesRes.ok) {
        setClientes(await clientesRes.json());
      }

      if (configuracionesRes.ok) {
        setConfiguraciones(await configuracionesRes.json());
      }
    } catch (err) {
      console.error('Error al cargar datos:', err);
      setError('Error al cargar los datos del crédito');
    } finally {
      setLoadingData(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/creditos/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          monto: parseFloat(formData.monto),
          configuracionCreditoId: formData.configuracionCreditoId,
          plazoMeses: parseInt(formData.plazoMeses),
          fechaInicio: formData.fechaInicio,
          estado: formData.estado,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Error al actualizar crédito');
      }

      router.push('/dashboard?tab=creditos');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loadingData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <i className="fa-solid fa-spinner fa-spin text-4xl text-blue-600 mb-4"></i>
          <p className="text-gray-600">Cargando crédito...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Editar Crédito</h2>
            <p className="text-sm text-gray-500 mt-1">Modifica los datos del crédito</p>
          </div>
          <button
            onClick={() => router.push('/dashboard?tab=creditos')}
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
                  Cliente (no editable)
                </label>
                <select
                  disabled
                  value={formData.clienteId}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed"
                >
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
                  Al cambiar la configuración se recalcularán las cuotas
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fecha de Inicio *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.fechaInicio}
                    onChange={(e) => setFormData({ ...formData, fechaInicio: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Estado *
                  </label>
                  <select
                    required
                    value={formData.estado}
                    onChange={(e) => setFormData({ ...formData, estado: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="borrador">Borrador</option>
                    <option value="validado">Validado</option>
                    <option value="activo">Activo</option>
                    <option value="pagado">Pagado</option>
                    <option value="vencido">Vencido</option>
                  </select>
                </div>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-sm text-yellow-800">
                  <strong>Advertencia:</strong> Al modificar el monto, plazo o configuración, se recalcularán todas las cuotas y se perderá el historial anterior.
                </p>
              </div>

              <div className="flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={() => router.push('/dashboard?tab=creditos')}
                  className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? 'Guardando...' : 'Guardar Cambios'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </>
  );
}
