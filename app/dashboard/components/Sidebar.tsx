'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: 'overview' | 'clientes' | 'creditos' | 'reportes' | 'configuracion') => void;
  user: any;
  onLogout: () => void;
  clientes: any[];
  creditos: any[];
}

export default function Sidebar({ activeTab, setActiveTab, user, onLogout, clientes, creditos }: SidebarProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const menuItems = [
    {
      id: 'overview',
      name: 'Panel Principal',
      icon: '📊',
      description: 'Vista general'
    },
    {
      id: 'clientes',
      name: 'Clientes',
      icon: '👥',
      badge: clientes.length,
      description: 'Gestionar clientes'
    },
    {
      id: 'creditos',
      name: 'Créditos',
      icon: '💰',
      badge: creditos.length,
      description: 'Gestionar créditos'
    },
    {
      id: 'reportes',
      name: 'Reportes',
      icon: '📈',
      description: 'Análisis y reportes'
    },
    {
      id: 'configuracion',
      name: 'Configuración',
      icon: '⚙️',
      description: 'Ajustes del sistema'
    }
  ];

  return (
    <>
      {/* Mobile menu button */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-md bg-blue-600 text-white"
      >
        {sidebarOpen ? '✕' : '☰'}
      </button>

      {/* Sidebar */}
      <div
        className={`${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0 fixed lg:static inset-y-0 left-0 z-40 w-64 bg-gradient-to-b from-blue-900 via-blue-800 to-blue-900 text-white transition-transform duration-300 ease-in-out flex flex-col`}
      >
        {/* Header */}
        <div className="p-6 border-b border-blue-700">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center text-2xl">
              💳
            </div>
            <div>
              <h1 className="text-xl font-bold">YaPresto</h1>
              <p className="text-xs text-blue-300">Sistema de Créditos</p>
            </div>
          </div>
        </div>

        {/* User Info */}
        <div className="p-4 border-b border-blue-700">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
              <span className="text-lg">👤</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user?.name}</p>
              <p className="text-xs text-blue-300 truncate">{user?.email}</p>
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
                  ? 'bg-blue-700 text-white'
                  : 'text-blue-100 hover:bg-blue-800'
              } group flex items-center w-full px-3 py-3 text-sm font-medium rounded-lg transition-colors duration-150`}
            >
              <span className="text-2xl mr-3">{item.icon}</span>
              <div className="flex-1 text-left">
                <div className="flex items-center justify-between">
                  <span>{item.name}</span>
                  {item.badge !== undefined && (
                    <span className="ml-2 px-2 py-0.5 text-xs font-semibold rounded-full bg-blue-500 text-white">
                      {item.badge}
                    </span>
                  )}
                </div>
                <p className="text-xs text-blue-300 mt-0.5">{item.description}</p>
              </div>
            </button>
          ))}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-blue-700 space-y-2">
          <button
            onClick={onLogout}
            className="w-full flex items-center px-3 py-2 text-sm font-medium text-blue-100 hover:bg-red-600 rounded-lg transition-colors duration-150"
          >
            <span className="text-xl mr-3">🚪</span>
            <span>Cerrar Sesión</span>
          </button>
          <div className="text-xs text-blue-400 text-center pt-2">
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
