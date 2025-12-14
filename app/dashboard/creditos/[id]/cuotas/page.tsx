'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { formatCurrency, getCurrencySymbol } from '@/lib/currency';

export default function CuotasCreditoPage() {
  const router = useRouter();
  const params = useParams();
  const [credito, setCredito] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [empresa, setEmpresa] = useState<any>(null);

  // Obtener moneda de la empresa
  const monedaEmpresa = empresa?.moneda || 'USD';
  const simboloMoneda = getCurrencySymbol(monedaEmpresa);
  const formatMoney = (amount: number, decimals = 2) => formatCurrency(amount, monedaEmpresa, { decimals });

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
    loadCredito();
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

  const exportarPDF = () => {
    const doc = new jsPDF();
    
    // Título
    doc.setFontSize(18);
    doc.text('Tabla de Amortización', 14, 20);
    
    // Información del cliente y crédito
    doc.setFontSize(10);
    doc.text(`Cliente: ${credito.cliente?.nombre} ${credito.cliente?.apellido}`, 14, 30);
    doc.text(`Cédula: ${credito.cliente?.cedula}`, 14, 36);
    doc.text(`Monto: ${formatMoney(credito.monto)}`, 14, 42);
    doc.text(`Interés: ${credito.tasaInteres}%`, 80, 42);
    doc.text(`Plazo: ${credito.plazoMeses} meses`, 130, 42);
    doc.text(`Cuota Mensual: ${formatMoney(credito.cuotaMensual)}`, 14, 48);
    doc.text(`Total Intereses: ${formatMoney(totalInteres)}`, 80, 48);
    doc.text(`Total a Pagar: ${formatMoney(totalPagado)}`, 130, 48);
    
    // Tabla
    autoTable(doc, {
      startY: 55,
      head: [['No.', 'Fecha', 'Balance Inicial', 'Cuota', 'Capital', 'Interés', 'Balance Final', 'Estado']],
      body: credito.cuotas?.map((cuota: any) => [
        cuota.numeroCuota,
        new Date(cuota.fechaVencimiento).toLocaleDateString('es-ES'),
        formatMoney(cuota.balanceInicial),
        formatMoney(cuota.montoCuota),
        formatMoney(cuota.capital),
        formatMoney(cuota.interes),
        formatMoney(cuota.balanceFinal),
        cuota.pagado ? 'Pagado' : 'Pendiente'
      ]) || [],
      styles: { fontSize: 8 },
      headStyles: { fillColor: [37, 99, 235] }
    });
    
    doc.save(`amortizacion_${credito.cliente?.cedula}_${Date.now()}.pdf`);
  };

  const exportarExcel = () => {
    const datos = [
      ['Tabla de Amortización'],
      [],
      ['Cliente:', `${credito.cliente?.nombre} ${credito.cliente?.apellido}`],
      ['Cédula:', credito.cliente?.cedula],
      ['Monto:', formatMoney(credito.monto)],
      ['Interés:', `${credito.tasaInteres}%`],
      ['Plazo:', `${credito.plazoMeses} meses`],
      ['Cuota Mensual:', formatMoney(credito.cuotaMensual)],
      ['Total Intereses:', formatMoney(totalInteres)],
      ['Total a Pagar:', formatMoney(totalPagado)],
      [],
      ['No.', 'Fecha', 'Balance Inicial', 'Cuota', 'Capital', 'Interés', 'Balance Final', 'Estado'],
      ...(credito.cuotas?.map((cuota: any) => [
        cuota.numeroCuota,
        new Date(cuota.fechaVencimiento).toLocaleDateString('es-ES'),
        cuota.balanceInicial.toFixed(2),
        cuota.montoCuota.toFixed(2),
        cuota.capital.toFixed(2),
        cuota.interes.toFixed(2),
        cuota.balanceFinal.toFixed(2),
        cuota.pagado ? 'Pagado' : 'Pendiente'
      ]) || [])
    ];

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(datos);
    
    // Ajustar ancho de columnas
    ws['!cols'] = [
      { wch: 5 },
      { wch: 12 },
      { wch: 15 },
      { wch: 12 },
      { wch: 12 },
      { wch: 12 },
      { wch: 15 },
      { wch: 10 }
    ];
    
    XLSX.utils.book_append_sheet(wb, ws, 'Amortización');
    XLSX.writeFile(wb, `amortizacion_${credito.cliente?.cedula}_${Date.now()}.xlsx`);
  };

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
          <div className="flex items-center space-x-3">
            <button
              onClick={exportarPDF}
              className="flex items-center space-x-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 font-medium transition-colors shadow-sm"
              title="Exportar a PDF"
            >
              <i className="fa-solid fa-file-pdf"></i>
              <span>PDF</span>
            </button>
            <button
              onClick={exportarExcel}
              className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 font-medium transition-colors shadow-sm"
              title="Exportar a Excel"
            >
              <i className="fa-solid fa-file-excel"></i>
              <span>Excel</span>
            </button>
            <button
              onClick={() => router.push('/dashboard?tab=creditos')}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <span>←</span>
              <span>Volver</span>
            </button>
          </div>
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
                <p className="text-xl font-bold text-gray-900">{formatMoney(credito.monto)}</p>
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
                    {formatMoney(credito.cuotaMensual)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Número de Pagos</p>
                  <p className="text-xl font-bold text-gray-900">{credito.cuotas?.length || 0}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Interés Total</p>
                  <p className="text-xl font-bold text-orange-600">{formatMoney(totalInteres)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Total a Pagar</p>
                  <p className="text-xl font-bold text-green-600">{formatMoney(totalPagado)}</p>
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
                        {formatMoney(cuota.balanceInicial)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-right font-semibold" style={{ color: user?.empresaActiva?.color || '#2563eb' }}>
                        {formatMoney(cuota.montoCuota)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-gray-900">
                        {formatMoney(cuota.capital)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-orange-600">
                        {formatMoney(cuota.interes)}
                      </td>
                      <td className={`px-4 py-3 whitespace-nowrap text-sm text-right font-semibold ${
                        cuota.balanceFinal < 1 ? 'text-green-600' : 'text-gray-900'
                      }`}>
                        {formatMoney(cuota.balanceFinal)}
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
                      {formatMoney(totalPagado)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-right font-bold text-gray-900">
                      {formatMoney(credito.monto)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-right font-bold text-orange-600">
                      {formatMoney(totalInteres)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-right font-bold text-green-600">
                      {formatMoney(0)}
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
