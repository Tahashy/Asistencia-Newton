import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import {
  Home, UserCheck, BarChart3, Users, FileText, Settings,
  X, Menu, CheckSquare, LogOut, BookOpen
} from 'lucide-react';

const Layout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { currentUser, logoutUser } = useApp();

  const menuItems = [
    { id: 'dashboard', path: '/dashboard', label: 'Dashboard', icon: Home, roles: ['admin', 'supervisor'] },
    { id: 'registro', path: '/registro', label: 'Registrar Asistencia', icon: UserCheck, roles: ['admin', 'supervisor'] },
    { id: 'reportes', path: '/reportes', label: 'Reportes', icon: BarChart3, roles: ['admin', 'supervisor'] },
    { id: 'academico', path: '/academico', label: 'Rendimiento Académico', icon: BookOpen, roles: ['admin', 'supervisor'] },
    { id: 'personal', path: '/personal', label: 'Gestión Personal', icon: Users, roles: ['admin'] },
    { id: 'justificaciones', path: '/justificaciones', label: 'Justificaciones', icon: FileText, roles: ['admin', 'supervisor'] },
    { id: 'configuracion', path: '/configuracion', label: 'Configuración', icon: Settings, roles: ['admin'] }
  ];

  const filteredMenu = menuItems.filter(item => item.roles.includes(currentUser?.rol));

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="lg:hidden fixed top-0 left-0 right-0 bg-white border-b border-gray-200 z-40">
        <div className="flex items-center justify-between px-4 py-3">
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 rounded-lg hover:bg-gray-100">
            {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
          <h1 className="text-lg font-bold text-gray-800">AsistenciaApp</h1>
          <div className="w-10"></div>
        </div>
      </div>

      <aside className={`fixed top-0 left-0 h-full overflow-y-auto bg-gradient-to-b from-blue-600 to-blue-800 text-white w-64 z-50 transform transition-transform duration-300 lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} scrollbar-thin`}>
        <style>{`
          .scrollbar-thin::-webkit-scrollbar {
            width: 4px;
          }
          .scrollbar-thin::-webkit-scrollbar-track {
            background: rgba(255, 255, 255, 0.05);
          }
          .scrollbar-thin::-webkit-scrollbar-thumb {
            background: rgba(255, 255, 255, 0.2);
            border-radius: 20px;
          }
          .scrollbar-thin::-webkit-scrollbar-thumb:hover {
            background: rgba(255, 255, 255, 0.3);
          }
        `}</style>
        <div className="p-6">
          <div className="flex items-center gap-3 mb-8">
            <CheckSquare className="w-8 h-8" />
            <div>
              <h1 className="text-xl font-bold">AsistenciaApp</h1>
              <p className="text-xs text-blue-200">Control Empresarial</p>
            </div>
          </div>

          <div className="bg-white/10 rounded-lg p-4 mb-6">
            <p className="text-sm opacity-80">Sesión iniciada:</p>
            <p className="font-semibold">{currentUser?.nombre}</p>
            <p className="text-xs opacity-70 capitalize">{currentUser?.rol}</p>
          </div>

          <nav className="space-y-2">
            {filteredMenu.map(item => {
              const Icon = item.icon;

              return (
                <NavLink
                  key={item.id}
                  to={item.path}
                  onClick={() => setSidebarOpen(false)}
                  className={({ isActive }) =>
                    `w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${isActive ? 'bg-white text-blue-600 font-semibold shadow-lg' : 'hover:bg-white/10'}`
                  }
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </nav>

          <button
            onClick={() => {
              logoutUser();
              setSidebarOpen(false);
            }}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg bg-red-500/20 hover:bg-red-500/30 transition-all mt-4"
          >
            <LogOut className="w-5 h-5" />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </aside>

      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)}></div>
      )}

      <main className="lg:ml-64 pt-16 lg:pt-0 min-h-screen">
        <div className="p-4 md:p-6 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;
