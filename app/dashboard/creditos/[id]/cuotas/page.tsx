'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';

export default function CuotasCreditoPage() {
  const router = useRouter();
  const params = useParams();
  const [credito, setCredito] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
    loadCredito();
  }, []);

  const loadCredito = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/creditos/${params.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (res.ok) {
        const data = await res.json();
        setCredito(data);
      }
    } catch (error) {
      console.error('Error al cargar crédito:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <i className="fa-solid fa-spinner fa-spin text-4xl text-blue-600 mb-4"></i>
          <p className="text-gray-600">Cargando tabla de amortización...</p>
        </div>
      </div>
    );
  }

  if (!credito) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <i className="fa-solid fa-exclamation-circle text-4xl text-red-600 mb-4"></i>
          <p className="text-gray-600">Crédito no encontrado</p>
        </div>
      </div>
    );
  }

  const totalInteres = credito.cuotas?.reduce((sum: number, c: any) => sum + c.interes, 0) || 0;
  const totalPagado = credito.cuotas?.reduce((sum: number, c: any) => sum + c.montoCuota, 0) || 0;

  return (
    <>
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Tabla de Amortización</h2>
            <p className="text-sm text-gray-500 mt-1">
              Crédito de {credito.cliente?.nombre} {credito.cliente?.apellido}
            </p>
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
      <main className="flex-1 overflow-y-auto p-6 bg-gray-50">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Resumen del Crédito */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <i className="fa-solid fa-info-circle mr-2" style={{ color: user?.empresaActiva?.color || '#2563eb' }}></i>
              Información del Crédito
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div>
                <p className="text-sm text-gray-500">Monto del Préstamo</p>
                <p className="text-xl font-bold text-gray-900">${credito.monto.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Interés Anual</p>
                <p className="text-xl font-bold" style={{ color: user?.empresaActiva?.color || '#2563eb' }}>
                  {credito.tasaInteres}%
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Período del Préstamo</p>
                <p className="text-xl font-bold text-gray-900">{credito.plazoMeses} meses</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Fecha Inicial</p>
                <p className="text-xl font-bold text-gray-900">
                  {new Date(credito.fechaInicio).toLocaleDateString('es-ES')}
                </p>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div>
                  <p className="text-sm text-gray-500">Cuota Mensual</p>
                  <p className="text-xl font-bold" style={{ color: user?.empresaActiva?.color || '#2563eb' }}>
                    ${credito.cuotaMensual.toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Número de Pagos</p>
                  <p className="text-xl font-bold text-gray-900">{credito.cuotas?.length || 0}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Interés Total</p>
                  <p className="text-xl font-bold text-orange-600">${totalInteres.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Total a Pagar</p>
                  <p className="text-xl font-bold text-green-600">${totalPagado.toFixed(2)}</p>
                </div>
              </div>
            </div>

            <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-sm text-blue-800">
                <strong>Sistema de Amortización:</strong> {credito.configuracionCredito?.tipoCalculo?.toUpperCase() || 'FRANCÉS'}
              </p>
            </div>
          </div>

          {/* Tabla de Cuotas */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <i className="fa-solid fa-table mr-2" style={{ color: user?.empresaActiva?.color || '#2563eb' }}></i>
                Tabla de Amortización Detallada
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      No.
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Fecha del Pago
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Balance Inicial
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Cuota
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Capital
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Interés
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Balance Final
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Estado
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {credito.cuotas?.map((cuota: any) => (
                    <tr 
                      key={cuota.id} 
                      className={`hover:bg-gray-50 transition-colors ${cuota.pagado ? 'bg-green-50' : ''}`}
                    >
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                        {cuota.numeroCuota}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                        {new Date(cuota.fechaVencimiento).toLocaleDateString('es-ES')}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-gray-900 font-medium">
                        ${cuota.balanceInicial.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-right font-semibold" style={{ color: user?.empresaActiva?.color || '#2563eb' }}>
                        ${cuota.montoCuota.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-gray-900">
                        ${cuota.capital.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-orange-600">
                        ${cuota.interes.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className={`px-4 py-3 whitespace-nowrap text-sm text-right font-semibold ${
                        cuota.balanceFinal < 1 ? 'text-green-600' : 'text-gray-900'
                      }`}>
                        ${cuota.balanceFinal.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-center">
                        {cuota.pagado ? (
                          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                            <i className="fa-solid fa-check mr-1"></i>
                            Pagado
                          </span>
                        ) : (
                          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
                            <i className="fa-solid fa-clock mr-1"></i>
                            Pendiente
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-50 border-t-2 border-gray-300">
                  <tr>
                    <td colSpan={3} className="px-4 py-3 text-sm font-bold text-gray-900 text-right">
                      TOTALES:
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-right font-bold" style={{ color: user?.empresaActiva?.color || '#2563eb' }}>
                      ${totalPagado.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-right font-bold text-gray-900">
                      ${credito.monto.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-right font-bold text-orange-600">
                      ${totalInteres.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-right font-bold text-green-600">
                      $0.00
                    </td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
