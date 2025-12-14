'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';

export default function AprobacionCreditoPage() {
  const params = useParams();
  const [credito, setCredito] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [procesando, setProcesando] = useState(false);
  const [respuestaEnviada, setRespuestaEnviada] = useState(false);

  useEffect(() => {
    cargarCredito();
  }, []);

  const cargarCredito = async () => {
    try {
      const res = await fetch(`/api/creditos/aprobar/${params.token}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Error al cargar la oferta');
      }

      setCredito(data);
      if (data.yaRespondido) {
        setRespuestaEnviada(true);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDecision = async (decision: 'aprobado' | 'rechazado') => {
    if (window.confirm(`¿Está seguro de ${decision === 'aprobado' ? 'aprobar' : 'rechazar'} esta oferta de crédito?`)) {
      setProcesando(true);
      setError('');

      try {
        const res = await fetch(`/api/creditos/aprobar/${params.token}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ decision }),
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || 'Error al procesar la decisión');
        }

        setRespuestaEnviada(true);
        setCredito({ ...credito, estadoAprobacion: decision });
      } catch (err: any) {
        setError(err.message);
      } finally {
        setProcesando(false);
      }
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
    }).format(amount);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('es-CL', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="text-center bg-white rounded-2xl shadow-xl p-8">
          <i className="fa-solid fa-spinner fa-spin text-5xl mb-4" style={{ color: credito?.empresa?.color || '#2563eb' }}></i>
          <p className="text-gray-600 text-lg">Cargando oferta de crédito...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center">
            <i className="fa-solid fa-exclamation-circle text-6xl text-red-500 mb-4"></i>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Error</h1>
            <p className="text-gray-600 mb-6">{error}</p>
            <a
              href="/"
              className="inline-block px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Volver al inicio
            </a>
          </div>
        </div>
      </div>
    );
  }

  if (respuestaEnviada || credito?.yaRespondido) {
    const esAprobado = credito?.estadoAprobacion === 'aprobado';
    return (
      <div className={`min-h-screen bg-gradient-to-br ${esAprobado ? 'from-green-50 to-emerald-100' : 'from-red-50 to-orange-100'} flex items-center justify-center p-4`}>
        <div className="max-w-2xl w-full bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center">
            <i className={`fa-solid ${esAprobado ? 'fa-check-circle text-green-500' : 'fa-times-circle text-red-500'} text-7xl mb-6`}></i>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              {esAprobado ? '¡Oferta Aprobada!' : 'Oferta Rechazada'}
            </h1>
            <p className="text-lg text-gray-600 mb-6">
              {esAprobado
                ? 'Has aprobado exitosamente la oferta de crédito. La empresa se pondrá en contacto contigo pronto.'
                : 'Has rechazado la oferta de crédito. Gracias por tu tiempo.'}
            </p>
            {credito?.fechaRespuesta && (
              <p className="text-sm text-gray-500">
                Respondido el {formatDate(credito.fechaRespuesta)}
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header con branding de la empresa */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-6">
          <div className="flex items-center justify-between mb-6">
            {credito.empresa?.logo && (
              <img
                src={credito.empresa.logo}
                alt={credito.empresa.nombre}
                className="h-16 object-contain"
              />
            )}
            <div className="text-right">
              <h2 className="text-2xl font-bold text-gray-900">{credito.empresa?.nombre}</h2>
              <p className="text-gray-600">Oferta de Crédito</p>
            </div>
          </div>

          <div className="border-t border-gray-200 pt-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Hola, {credito.cliente?.nombre} {credito.cliente?.apellido}
            </h1>
            <p className="text-lg text-gray-600">
              Tienes una oferta de crédito pendiente de aprobación
            </p>
          </div>
        </div>

        {/* Detalles del crédito */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-6">
          <h3 className="text-xl font-bold text-gray-900 mb-6">Detalles de la Oferta</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6">
              <p className="text-sm text-gray-600 mb-1">Monto del Crédito</p>
              <p className="text-3xl font-bold" style={{ color: credito.empresa?.color || '#2563eb' }}>
                {formatCurrency(credito.monto)}
              </p>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6">
              <p className="text-sm text-gray-600 mb-1">Cuota Mensual</p>
              <p className="text-3xl font-bold text-purple-600">
                {formatCurrency(credito.cuotaMensual)}
              </p>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6">
              <p className="text-sm text-gray-600 mb-1">Plazo</p>
              <p className="text-3xl font-bold text-green-600">
                {credito.plazoMeses} meses
              </p>
            </div>

            <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-xl p-6">
              <p className="text-sm text-gray-600 mb-1">Tasa de Interés</p>
              <p className="text-3xl font-bold text-orange-600">
                {credito.tasaInteres}%
              </p>
            </div>
          </div>

          <div className="bg-gray-50 rounded-xl p-6 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-600">Fecha de inicio</p>
                <p className="font-semibold text-gray-900">{formatDate(credito.fechaInicio)}</p>
              </div>
              <div>
                <p className="text-gray-600">Fecha de vencimiento</p>
                <p className="font-semibold text-gray-900">{formatDate(credito.fechaVencimiento)}</p>
              </div>
              <div>
                <p className="text-gray-600">Configuración</p>
                <p className="font-semibold text-gray-900">{credito.configuracionCredito?.nombre}</p>
              </div>
              <div>
                <p className="text-gray-600">Tipo de cálculo</p>
                <p className="font-semibold text-gray-900">{credito.configuracionCredito?.tipoCalculo}</p>
              </div>
            </div>
          </div>

          {/* Plan de pagos */}
          <div className="border-t border-gray-200 pt-6">
            <h4 className="font-bold text-gray-900 mb-4">Plan de Pagos</h4>
            <div className="max-h-96 overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="px-4 py-3 text-left">Cuota</th>
                    <th className="px-4 py-3 text-right">Fecha</th>
                    <th className="px-4 py-3 text-right">Capital</th>
                    <th className="px-4 py-3 text-right">Interés</th>
                    <th className="px-4 py-3 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {credito.cuotas?.map((cuota: any) => (
                    <tr key={cuota.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">{cuota.numeroCuota}</td>
                      <td className="px-4 py-3 text-right">{new Date(cuota.fechaVencimiento).toLocaleDateString('es-CL')}</td>
                      <td className="px-4 py-3 text-right">{formatCurrency(cuota.capital)}</td>
                      <td className="px-4 py-3 text-right">{formatCurrency(cuota.interes)}</td>
                      <td className="px-4 py-3 text-right font-semibold">{formatCurrency(cuota.montoCuota)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Botones de acción */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h3 className="text-xl font-bold text-gray-900 mb-4">¿Qué deseas hacer?</h3>
          <p className="text-gray-600 mb-6">
            Por favor, revisa cuidadosamente los términos de la oferta antes de tomar una decisión.
          </p>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={() => handleDecision('rechazado')}
              disabled={procesando}
              className="flex-1 px-8 py-4 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 disabled:opacity-50 transition-colors font-semibold text-lg"
            >
              {procesando ? (
                <><i className="fa-solid fa-spinner fa-spin mr-2"></i> Procesando...</>
              ) : (
                <><i className="fa-solid fa-times mr-2"></i> Rechazar Oferta</>
              )}
            </button>
            <button
              onClick={() => handleDecision('aprobado')}
              disabled={procesando}
              className="flex-1 px-8 py-4 text-white rounded-xl hover:opacity-90 disabled:opacity-50 transition-colors font-semibold text-lg"
              style={{ backgroundColor: credito.empresa?.color || '#2563eb' }}
            >
              {procesando ? (
                <><i className="fa-solid fa-spinner fa-spin mr-2"></i> Procesando...</>
              ) : (
                <><i className="fa-solid fa-check mr-2"></i> Aprobar Oferta</>
              )}
            </button>
          </div>
        </div>

        <p className="text-center text-gray-500 text-sm mt-6">
          Esta es una comunicación oficial de {credito.empresa?.nombre}
        </p>
      </div>
    </div>
  );
}
