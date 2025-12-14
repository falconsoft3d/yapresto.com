'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { formatCurrency, getCurrencySymbol } from '@/lib/currency';

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
  const [urlPublica, setUrlPublica] = useState('');
  const [generandoUrl, setGenerandoUrl] = useState(false);
  const [creditoData, setCreditoData] = useState<any>(null);
  const [empresa, setEmpresa] = useState<any>(null);
  const monedaEmpresa = empresa?.moneda || 'USD';
  const simboloMoneda = getCurrencySymbol(monedaEmpresa);
  const formatMoney = (amount: number, decimals = 2) => formatCurrency(amount, monedaEmpresa, { decimals });

  useEffect(() => {
    loadData();
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
        setCreditoData(credito);
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

        // Si ya tiene token, mostrar la URL
        if (credito.tokenPublico) {
          const url = `${window.location.origin}/aprobacion/${credito.tokenPublico}`;
          setUrlPublica(url);
        }
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

  const generarUrlPublica = async () => {
    setGenerandoUrl(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/creditos/${params.id}/generar-token`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Error al generar URL');
      }

      const data = await res.json();
      setUrlPublica(data.url);
      
      // Copiar automáticamente al portapapeles
      await navigator.clipboard.writeText(data.url);
      alert('✅ URL copiada al portapapeles');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setGenerandoUrl(false);
    }
  };

  const copiarUrl = async () => {
    try {
      await navigator.clipboard.writeText(urlPublica);
      alert('✅ URL copiada al portapapeles');
    } catch (err) {
      alert('❌ Error al copiar URL');
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

            {/* Sección de URL Pública para Aprobación */}
            {creditoData && (
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6 mb-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <i className="fa-solid fa-link text-blue-600 text-xl"></i>
                      <h3 className="text-lg font-bold text-gray-900">Compartir Oferta con Cliente</h3>
                    </div>
                    <p className="text-sm text-gray-600 mb-4">
                      Genera una URL pública para que el cliente pueda ver y aprobar/rechazar la oferta de crédito
                    </p>

                    {urlPublica ? (
                      <div className="space-y-3">
                        <div className="flex items-center space-x-2 bg-white rounded-lg p-3 border border-gray-200">
                          <input
                            type="text"
                            value={urlPublica}
                            readOnly
                            className="flex-1 text-sm text-gray-700 bg-transparent border-none focus:outline-none"
                          />
                          <button
                            type="button"
                            onClick={copiarUrl}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm whitespace-nowrap"
                          >
                            <i className="fa-solid fa-copy mr-2"></i>
                            Copiar
                          </button>
                        </div>

                        {creditoData.estadoAprobacion && (
                          <div className={`flex items-center space-x-2 p-3 rounded-lg ${
                            creditoData.estadoAprobacion === 'aprobado' 
                              ? 'bg-green-100 text-green-800 border border-green-300' 
                              : creditoData.estadoAprobacion === 'rechazado'
                              ? 'bg-red-100 text-red-800 border border-red-300'
                              : 'bg-yellow-100 text-yellow-800 border border-yellow-300'
                          }`}>
                            <i className={`fa-solid ${
                              creditoData.estadoAprobacion === 'aprobado' ? 'fa-check-circle' :
                              creditoData.estadoAprobacion === 'rechazado' ? 'fa-times-circle' :
                              'fa-clock'
                            }`}></i>
                            <span className="font-semibold">
                              Estado: {creditoData.estadoAprobacion === 'aprobado' ? 'Aprobado' : 
                                      creditoData.estadoAprobacion === 'rechazado' ? 'Rechazado' : 
                                      'Pendiente de respuesta'}
                            </span>
                            {creditoData.fechaRespuesta && (
                              <span className="text-sm">
                                el {new Date(creditoData.fechaRespuesta).toLocaleDateString('es-CL')}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={generarUrlPublica}
                        disabled={generandoUrl}
                        className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors font-semibold"
                      >
                        {generandoUrl ? (
                          <><i className="fa-solid fa-spinner fa-spin mr-2"></i> Generando...</>
                        ) : (
                          <><i className="fa-solid fa-share-nodes mr-2"></i> Generar URL Pública</>
                        )}
                      </button>
                    )}
                  </div>
                </div>
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
                    Monto ({simboloMoneda}) *
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
