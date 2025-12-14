'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function NuevaConfiguracionCredito() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [formData, setFormData] = useState({
    nombre: '',
    interesAnual: '',
    tipoCalculo: 'frances',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/configuracion-creditos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Error al crear configuración');
      }

      router.push('/dashboard?tab=configuracion-creditos');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-4">
        <div className="mb-6">
          <button
            onClick={() => router.push('/dashboard?tab=configuracion-creditos')}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <i className="fa-solid fa-arrow-left mr-2"></i>
            <span>Volver</span>
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Nueva Configuración de Crédito</h1>
          <p className="text-gray-600 mt-2">Crea una nueva configuración de cálculo de créditos</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nombre *
              </label>
              <input
                type="text"
                required
                value={formData.nombre}
                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Ej: Crédito Personal"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Interés Anual (%) *
              </label>
              <input
                type="number"
                step="0.01"
                required
                value={formData.interesAnual}
                onChange={(e) => setFormData({ ...formData, interesAnual: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Ej: 12.5"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tipo de Cálculo *
              </label>
              <select
                value={formData.tipoCalculo}
                onChange={(e) => setFormData({ ...formData, tipoCalculo: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="frances">Francés</option>
                <option value="aleman">Alemán</option>
                <option value="americano">Americano</option>
              </select>
              <p className="text-sm text-gray-500 mt-1">
                Sistema de amortización que se utilizará para calcular las cuotas
              </p>
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={() => router.push('/dashboard?tab=configuracion-creditos')}
                className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 text-white rounded-lg font-medium transition-all shadow-sm hover:shadow-md hover:scale-105 disabled:opacity-50"
                style={{ backgroundColor: user?.empresaActiva?.color || '#2563eb' }}
              >
                {loading ? 'Creando...' : 'Crear Configuración'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
