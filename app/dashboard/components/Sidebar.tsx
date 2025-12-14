'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: 'overview' | 'clientes' | 'evaluacion' | 'creditos' | 'pagos' | 'cuotas' | 'reportes' | 'configuracion' | 'perfil' | 'empresas' | 'usuarios' | 'configuracion-creditos') => void;
  user: any;
  onLogout: () => void;
  clientes: any[];
  creditos: any[];
}

// Función para ajustar el brillo del color
function adjustColor(color: string, amount: number): string {
  const clamp = (num: number) => Math.min(Math.max(num, 0), 255);
  const num = parseInt(color.replace('#', ''), 16);
  const r = clamp((num >> 16) + amount);
  const g = clamp(((num >> 8) & 0x00FF) + amount);
  const b = clamp((num & 0x0000FF) + amount);
  return `#${(0x1000000 + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

export default function Sidebar({ activeTab, setActiveTab, user, onLogout, clientes, creditos }: SidebarProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Obtener el color de la empresa activa o usar el azul por defecto
  const primaryColor = user?.empresaActiva?.color || '#2563eb';

  const menuItems = [
    {
      id: 'overview',
      name: 'Panel Principal',
      icon: 'fa-solid fa-chart-line',
      description: 'Vista general'
    },
    {
      id: 'clientes',
      name: 'Clientes',
      icon: 'fa-solid fa-users',
      badge: clientes.length,
      description: 'Gestionar clientes'
    },
    {
      id: 'evaluacion',
      name: 'Evaluación',
      icon: 'fa-solid fa-calculator',
      description: 'Evaluar capacidad crediticia'
    },
    {
      id: 'creditos',
      name: 'Créditos',
      icon: 'fa-solid fa-money-bill-wave',
      badge: creditos.length,
      description: 'Gestionar créditos'
    },
    {
      id: 'pagos',
      name: 'Pagos',
      icon: 'fa-solid fa-hand-holding-dollar',
      description: 'Registrar pagos'
    },
    {
      id: 'cuotas',
      name: 'Cuotas',
      icon: 'fa-solid fa-list-check',
      description: 'Ver todas las cuotas'
    },
    {
      id: 'empresas',
      name: 'Empresas',
      icon: 'fa-solid fa-building',
      description: 'Gestionar empresas'
    },
    {
      id: 'usuarios',
      name: 'Usuarios',
      icon: 'fa-solid fa-user',
      description: 'Gestionar usuarios'
    },
    {
      id: 'configuracion-creditos',
      name: 'Conf. Créditos',
      icon: 'fa-solid fa-gear',
      description: 'Configurar créditos'
    }
  ];

  return (
    <>
      {/* Mobile menu button */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-md text-white"
        style={{ backgroundColor: primaryColor }}
      >
        {sidebarOpen ? '✕' : '☰'}
      </button>

      {/* Sidebar */}
      <div
        className={`${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0 fixed lg:static inset-y-0 left-0 z-40 w-64 text-white transition-transform duration-300 ease-in-out flex flex-col`}
        style={{
          background: `linear-gradient(to bottom, ${primaryColor}, ${adjustColor(primaryColor, -20)}, ${primaryColor})`
        }}
      >
        {/* Header */}
        <div className="p-6 border-b" style={{ borderColor: adjustColor(primaryColor, -30) }}>
          <div className="flex items-center space-x-3">
            <div 
              className="w-10 h-10 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: adjustColor(primaryColor, 30) }}
            >
              <i className="fa-solid fa-credit-card text-white text-xl"></i>
            </div>
            <div>
              <h1 className="text-xl font-bold">YaPresto</h1>
              <p className="text-xs opacity-90" style={{ color: adjustColor(primaryColor, 100) }}>Sistema de Créditos</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as any)}
              className={`${
                activeTab === item.id
                  ? 'text-white'
                  : 'hover:bg-white/10'
              } group flex items-center w-full px-3 py-3 text-sm font-medium rounded-lg transition-colors duration-150`}
              style={activeTab === item.id ? { backgroundColor: adjustColor(primaryColor, -30) } : { color: 'rgba(255, 255, 255, 0.9)' }}
            >
              <i className={`${item.icon} text-lg mr-3`}></i>
              <div className="flex-1 text-left">
                <div className="flex items-center justify-between">
                  <span>{item.name}</span>
                  {item.badge !== undefined && (
                    <span 
                      className="ml-2 px-2 py-0.5 text-xs font-semibold rounded-full text-white"
                      style={{ backgroundColor: adjustColor(primaryColor, 30) }}
                    >
                      {item.badge}
                    </span>
                  )}
                </div>
                <p className="text-xs opacity-85 mt-0.5" style={{ color: adjustColor(primaryColor, 100) }}>{item.description}</p>
              </div>
            </button>
          ))}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t space-y-2" style={{ borderColor: adjustColor(primaryColor, -30) }}>
          <button
            onClick={onLogout}
            className="w-full flex items-center px-3 py-2 text-sm font-medium hover:bg-red-600 rounded-lg transition-colors duration-150"
            style={{ color: 'rgba(255, 255, 255, 0.9)' }}
          >
            <i className="fa-solid fa-right-from-bracket text-lg mr-3"></i>
            <span>Cerrar Sesión</span>
          </button>
          <div className="text-xs text-center pt-2 opacity-75" style={{ color: adjustColor(primaryColor, 100) }}>
            v1.0.0 • 2025
          </div>
        </div>
      </div>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-30"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </>
  );
}
