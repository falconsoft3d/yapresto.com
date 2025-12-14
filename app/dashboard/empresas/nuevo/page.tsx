'use client';

export const dynamic = 'force-dynamic';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function NuevaEmpresaPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    nombre: '',
    moneda: 'EUR',
    color: '#2563eb',
  });
  const [logo, setLogo] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const monedas = [
    { code: 'EUR', name: 'Euro (€)', symbol: '€' },
    { code: 'USD', name: 'Dólar ($)', symbol: '$' },
    { code: 'GBP', name: 'Libra (£)', symbol: '£' },
    { code: 'JPY', name: 'Yen (¥)', symbol: '¥' },
  ];

  const coloresPreset = [
    { name: 'Azul', value: '#2563eb' },
    { name: 'Verde', value: '#059669' },
    { name: 'Rojo', value: '#dc2626' },
    { name: 'Púrpura', value: '#7c3aed' },
    { name: 'Naranja', value: '#ea580c' },
    { name: 'Rosa', value: '#db2777' },
  ];

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert('El logo debe ser menor a 2MB');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setLogo(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/empresas', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          nombre: formData.nombre,
          moneda: formData.moneda,
          color: formData.color,
          logo: logo || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Error al crear empresa');
      }

      router.push('/dashboard?tab=empresas');
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
            <h2 className="text-2xl font-bold text-gray-900">Nueva Empresa</h2>
            <p className="text-sm text-gray-500 mt-1">Registra una nueva empresa en el sistema</p>
          </div>
          <button
            onClick={() => router.push('/dashboard?tab=empresas')}
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
              {/* Logo */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Logo de la Empresa
                </label>
                <div className="flex items-center space-x-6">
                  <div className="w-24 h-24 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden border-2 border-gray-300">
                    {logo ? (
                      <img src={logo} alt="Logo" className="w-full h-full object-cover" />
                    ) : (
                      <i className="fa-solid fa-building text-4xl text-gray-400"></i>
                    )}
                  </div>
                  <div className="flex-1">
                    <label className="cursor-pointer inline-flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
                      <span className="mr-2">📷</span>
                      <span>Subir Logo</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleLogoUpload}
                        className="hidden"
                      />
                    </label>
                    <p className="text-xs text-gray-500 mt-2">PNG o JPG (máx. 2MB)</p>
                  </div>
                </div>
              </div>

              {/* Nombre */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre de la Empresa *
                </label>
                <input
                  type="text"
                  required
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Ej: Mi Empresa S.A."
                />
              </div>

              {/* Moneda */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Moneda por Defecto *
                </label>
                <select
                  required
                  value={formData.moneda}
                  onChange={(e) => setFormData({ ...formData, moneda: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {monedas.map((moneda) => (
                    <option key={moneda.code} value={moneda.code}>
                      {moneda.name} {moneda.symbol}
                    </option>
                  ))}
                </select>
              </div>

              {/* Color */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Color de la Interfaz *
                </label>
                <div className="grid grid-cols-3 md:grid-cols-6 gap-3 mb-3">
                  {coloresPreset.map((color) => (
                    <button
                      key={color.value}
                      type="button"
                      onClick={() => setFormData({ ...formData, color: color.value })}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        formData.color === color.value
                          ? 'border-gray-900 scale-105'
                          : 'border-gray-200 hover:border-gray-400'
                      }`}
                      style={{ backgroundColor: color.value }}
                    >
                      <div className="text-white text-xs font-medium text-center">
                        {color.name}
                      </div>
                    </button>
                  ))}
                </div>
                <div className="flex items-center space-x-3">
                  <input
                    type="color"
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    className="h-10 w-20 rounded cursor-pointer border border-gray-300"
                  />
                  <input
                    type="text"
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="#2563eb"
                  />
                </div>
              </div>

              {/* Preview */}
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <p className="text-sm font-medium text-gray-700 mb-3">Vista Previa del Color</p>
                <div className="space-y-2">
                  <button
                    type="button"
                    style={{ backgroundColor: formData.color }}
                    className="px-4 py-2 text-white rounded-lg font-medium"
                  >
                    Botón de ejemplo
                  </button>
                  <div
                    style={{ borderColor: formData.color }}
                    className="border-l-4 pl-3 py-2 text-sm text-gray-600"
                  >
                    Este color se aplicará a elementos de la interfaz
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={() => router.push('/dashboard?tab=empresas')}
                  className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? 'Guardando...' : 'Crear Empresa'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </>
  );
}
