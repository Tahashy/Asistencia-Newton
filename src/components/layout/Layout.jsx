// src/components/layout/Layout.jsx
import { useState } from 'react';
import { 
  Home, UserCheck, FileText, Users, Settings, 
  Menu, X, LogOut, BarChart3, CheckSquare 
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const Layout = ({ children, currentPage, onNavigate }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { currentUser } = useApp();

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home, roles: ['admin', 'supervisor'] },
    { id: 'registro', label: 'Registrar Asistencia', icon: UserCheck, roles: ['admin', 'supervisor'] },
    { id: 'reportes', label: 'Reportes', icon: BarChart3, roles: ['admin', 'supervisor'] },
    { id: 'personal', label: 'Gestión Personal', icon: Users, roles: ['admin'] },
    { id: 'justificaciones', label: 'Justificaciones', icon: FileText, roles: ['admin', 'supervisor'] },
    { id: 'configuracion', label: 'Configuración', icon: Settings, roles: ['admin'] }
  ];

  const filteredMenu = menuItems.filter(item => 
    item.roles.includes(currentUser?.rol)
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Mobile */}
      <div className="lg:hidden fixed top-0 left-0 right-0 bg-white border-b border-gray-200 z-40">
        <div className="flex items-center justify-between px-4 py-3">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
          <h1 className="text-lg font-bold text-gray-800">Sistema de Asistencia</h1>
          <div className="w-10"></div>
        </div>
      </div>

      {/* Sidebar */}
      <aside className={`
        fixed top-0 left-0 h-full bg-gradient-to-b from-blue-600 to-blue-800 text-white w-64 z-50
        transform transition-transform duration-300 ease-in-out
        lg:translate-x-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="p-6">
          <div className="flex items-center gap-3 mb-8">
            <CheckSquare className="w-8 h-8" />
            <div>
              <h1 className="text-xl font-bold">AsistenciaApp</h1>
              <p className="text-xs text-blue-200">Control Empresarial</p>
            </div>
          </div>

          {/* User Info */}
          <div className="bg-white/10 rounded-lg p-4 mb-6">
            <p className="text-sm opacity-80">Sesión iniciada como:</p>
            <p className="font-semibold">{currentUser?.nombre}</p>
            <p className="text-xs opacity-70 capitalize">{currentUser?.rol}</p>
          </div>

          {/* Menu Items */}
          <nav className="space-y-2">
            {filteredMenu.map(item => {
              const Icon = item.icon;
              const isActive = currentPage === item.id;
              
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onNavigate(item.id);
                    setSidebarOpen(false);
                  }}
                  className={`
                    w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all
                    ${isActive 
                      ? 'bg-white text-blue-600 font-semibold shadow-lg' 
                      : 'hover:bg-white/10'
                    }
                  `}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Logout Button */}
          <button className="w-full flex items-center gap-3 px-4 py-3 mt-8 rounded-lg hover:bg-white/10 transition-colors text-red-200 hover:text-white">
            <LogOut className="w-5 h-5" />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        ></div>
      )}

      {/* Main Content */}
      <main className="lg:ml-64 pt-16 lg:pt-0 min-h-screen">
        <div className="p-4 md:p-6 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
};