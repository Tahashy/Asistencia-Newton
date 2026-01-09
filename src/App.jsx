import {Login} from './components/Login';
import React, { useState, createContext, useContext, useEffect } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import {
    Home, UserCheck, FileText, Users, Settings, Menu, X, LogOut,
    BarChart3, CheckSquare, Search, Clock, AlertCircle, CheckCircle,
    XCircle, Download, Calendar, TrendingUp, QrCode, Camera, Upload,
    Edit, Trash2, Plus, Filter, Eye, UserPlus, Save, ArrowLeft
} from 'lucide-react';

// Mock QRCode component (since qrcode.react isn't available)
const QRCode = ({ value, size, level, id }) => (
    <div
        id={id}
        className="bg-white p-4 border-4 border-gray-800 inline-block"
        style={{ width: size, height: size }}
    >
        <div className="w-full h-full bg-gray-900 flex items-center justify-center text-white text-xs break-all p-2">
            {value}
        </div>
    </div>
);

// ============================================
// CONTEXT
// ============================================
const AppContext = createContext();
// ============================================
// TOAST COMPONENT
// ============================================
const Toast = ({ message, type, onClose }) => {
    useEffect(() => {
        const timer = setTimeout(onClose, 4000);
        return () => clearTimeout(timer);
    }, [onClose]);

    const config = {
        success: { bg: 'bg-green-500', icon: <CheckCircle className="w-5 h-5" /> },
        error: { bg: 'bg-red-500', icon: <XCircle className="w-5 h-5" /> },
        warning: { bg: 'bg-yellow-500', icon: <AlertCircle className="w-5 h-5" /> },
        info: { bg: 'bg-blue-500', icon: <AlertCircle className="w-5 h-5" /> }
    };

    const current = config[type];

    return (
        <div className={`fixed top-4 right-4 z-50 ${current.bg} text-white px-6 py-4 rounded-lg shadow-2xl flex items-center gap-3 min-w-[320px] max-w-md animate-slide-in`}>
            {current.icon}
            <span className="flex-1">{message}</span>
            <button onClick={onClose} className="hover:bg-white/20 rounded p-1">
                <X className="w-4 h-4" />
            </button>
        </div>
    );
};

// ============================================
// LAYOUT
// ============================================
const Layout = ({ children, currentPage, onNavigate }) => {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const { currentUser,logoutUser } = useApp();

    const menuItems = [
        { id: 'dashboard', label: 'Dashboard', icon: Home, roles: ['admin', 'supervisor'] },
        { id: 'registro', label: 'Registrar Asistencia', icon: UserCheck, roles: ['admin', 'supervisor'] },
        { id: 'reportes', label: 'Reportes', icon: BarChart3, roles: ['admin', 'supervisor'] },
        { id: 'personal', label: 'Gestión Personal', icon: Users, roles: ['admin'] },
        { id: 'justificaciones', label: 'Justificaciones', icon: FileText, roles: ['admin', 'supervisor'] },
        { id: 'configuracion', label: 'Configuración', icon: Settings, roles: ['admin'] }
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

            <aside className={`fixed top-0 left-0 h-full bg-gradient-to-b from-blue-600 to-blue-800 text-white w-64 z-50 transform transition-transform duration-300 lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
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
                            const isActive = currentPage === item.id;

                            return (
                                <button
                                    key={item.id}
                                    onClick={() => {
                                        onNavigate(item.id);
                                        setSidebarOpen(false);
                                    }}
                                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${isActive ? 'bg-white text-blue-600 font-semibold shadow-lg' : 'hover:bg-white/10'}`}
                                >
                                    <Icon className="w-5 h-5" />
                                    <span>{item.label}</span>
                                </button>
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

// ============================================
// PAGES
// ============================================
const Dashboard = () => {
    const { getEstadisticasDelDia } = useApp();
    const stats = getEstadisticasDelDia();

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">Dashboard</h2>
                <p className="text-gray-600">
                    {new Date().toLocaleDateString('es-PE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-gradient-to-br from-green-500 to-green-600 text-white p-6 rounded-xl shadow-lg">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-green-100 text-sm mb-1">Presentes</p>
                            <p className="text-4xl font-bold">{stats.presentes}</p>
                        </div>
                        <CheckCircle className="w-12 h-12 text-green-200 opacity-80" />
                    </div>
                </div>

                <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 text-white p-6 rounded-xl shadow-lg">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-yellow-100 text-sm mb-1">Tardanzas</p>
                            <p className="text-4xl font-bold">{stats.tardanzas}</p>
                        </div>
                        <Clock className="w-12 h-12 text-yellow-200 opacity-80" />
                    </div>
                </div>

                <div className="bg-gradient-to-br from-red-500 to-red-600 text-white p-6 rounded-xl shadow-lg">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-red-100 text-sm mb-1">Ausentes</p>
                            <p className="text-4xl font-bold">{stats.ausentes}</p>
                        </div>
                        <XCircle className="w-12 h-12 text-red-200 opacity-80" />
                    </div>
                </div>

                <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-6 rounded-xl shadow-lg">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-blue-100 text-sm mb-1">Total Personal</p>
                            <p className="text-4xl font-bold">{stats.total}</p>
                            <p className="text-xs text-blue-100 mt-1">{stats.porcentajeAsistencia}% asistencia</p>
                        </div>
                        <Users className="w-12 h-12 text-blue-200 opacity-80" />
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <TrendingUp className="w-6 h-6 text-blue-600" />
                    Resumen de Asistencia
                </h3>
                <div className="h-64 flex items-center justify-center text-gray-400">
                    <div className="text-center">
                        <BarChart3 className="w-16 h-16 mx-auto mb-4 opacity-50" />
                        <p>Gráficos estadísticos próximamente</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

const Registro = () => {
    const { employees, registrarEntrada, registrarSalida,config } = useApp();
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedEmployee, setSelectedEmployee] = useState(null);
    const [scanMode, setScanMode] = useState(false);

    const filteredEmployees = employees.filter(e =>
        e.activo && (
            e.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
            e.apellido.toLowerCase().includes(searchTerm.toLowerCase()) ||
            e.area.toLowerCase().includes(searchTerm.toLowerCase()) ||
            e.sede.toLowerCase().includes(searchTerm.toLowerCase()) ||
            e.id.toLowerCase().includes(searchTerm.toLowerCase())
        )
    );

    const handleScan = (qrData) => {
        const employee = employees.find(e => e.qrCode === qrData);
        if (employee) {
            setSelectedEmployee(employee);
            setScanMode(false);
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">Registrar Asistencia</h2>
                <p className="text-gray-600">Registra entrada y salida de {config?.nombreEntidad?.toLowerCase() || 'personal'}</p>
            </div>

            {!scanMode ? (
                <>
                    <div className="bg-white rounded-xl shadow-lg p-6">
                        <div className="flex flex-col sm:flex-row gap-4 mb-6">
                            <div className="flex-1 relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                                <input
                                    type="text"
                                    placeholder="Buscar por nombre, ID, área o sede..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
                                />
                            </div>
                            <button
                                onClick={() => setScanMode(true)}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold flex items-center justify-center gap-2 transition-colors"
                            >
                                <Camera className="w-5 h-5" />
                                Escanear QR
                            </button>
                        </div>

                        <div className="space-y-2 max-h-96 overflow-y-auto">
                            {filteredEmployees.map(employee => (
                                <div
                                    key={employee.id}
                                    onClick={() => setSelectedEmployee(employee)}
                                    className={`p-4 border-2 rounded-lg cursor-pointer transition-all hover:shadow-md ${selectedEmployee?.id === employee.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-300'
                                        }`}
                                >
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="font-semibold text-lg">{employee.nombre} {employee.apellido}</p>
                                            <p className="text-sm text-gray-600">{employee.id} • {employee.area} • {employee.sede}</p>
                                        </div>
                                        <UserCheck className="w-6 h-6 text-gray-400" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {selectedEmployee && (
                        <div className="bg-white rounded-xl shadow-lg p-6">
                            <h3 className="text-xl font-bold mb-4">Registrar para:</h3>
                            <div className="bg-blue-50 p-4 rounded-lg mb-6">
                                <p className="font-semibold text-lg">{selectedEmployee.nombre} {selectedEmployee.apellido}</p>
                                <p className="text-sm text-gray-600">{selectedEmployee.area} - {selectedEmployee.sede}</p>
                                <p className="text-xs text-gray-500 mt-1">ID: {selectedEmployee.id}</p>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <button
                                    onClick={() => {
                                        registrarEntrada(selectedEmployee.id);
                                        setSelectedEmployee(null);
                                        setSearchTerm('');
                                    }}
                                    className="bg-green-500 hover:bg-green-600 text-white font-semibold py-4 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
                                >
                                    <CheckCircle className="w-5 h-5" />
                                    Registrar Entrada
                                </button>
                                <button
                                    onClick={() => {
                                        registrarSalida(selectedEmployee.id);
                                        setSelectedEmployee(null);
                                        setSearchTerm('');
                                    }}
                                    className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-4 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
                                >
                                    <Clock className="w-5 h-5" />
                                    Registrar Salida
                                </button>
                            </div>
                        </div>
                    )}
                </>
            ) : (
                <div className="bg-white rounded-xl shadow-lg p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-xl font-bold">Escanear Código QR</h3>
                        <button
                            onClick={() => setScanMode(false)}
                            className="text-gray-600 hover:text-gray-800 flex items-center gap-2"
                        >
                            <ArrowLeft className="w-5 h-5" />
                            Volver
                        </button>
                    </div>

                    <div className="bg-gray-100 rounded-lg p-8 text-center">
                        <Camera className="w-20 h-20 mx-auto mb-4 text-gray-400" />
                        <p className="text-gray-600 mb-4">Función de escaneo QR</p>
                        <p className="text-sm text-gray-500">En producción, aquí se activará la cámara</p>
                        <button
                            onClick={() => {
                                const mockEmployee = employees[0];
                                handleScan(mockEmployee.qrCode);
                            }}
                            className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-lg"
                        >
                            Simular Escaneo (Demo)
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

const Personal = () => {
    const { employees, agregarEmpleado, regenerarQR, config } = useApp();
    const [showForm, setShowForm] = useState(false);
    const [selectedEmployee, setSelectedEmployee] = useState(null);
    const [formData, setFormData] = useState({
        nombre: '',
        apellido: '',
        area: '',
        sede: '',
        telefono: '',
        email: ''
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        agregarEmpleado(formData);
        setFormData({ nombre: '', apellido: '', area: '', sede: '', telefono: '', email: '' });
        setShowForm(false);
    };

    const downloadQR = (employee) => {
        const canvas = document.getElementById(`qr-${employee.id}`);
        if (canvas) {
            const url = canvas.toDataURL?.() || '';
            const link = document.createElement('a');
            link.download = `QR-${employee.id}.png`;
            link.href = url;
            link.click();
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">
                        Gestión de {config?.nombreEntidad || 'Personal'}
                    </h2>
                    <p className="text-gray-600">
                        {employees.length} {employees.length === 1 ? (config?.nombreEntidadSingular || 'registro') : (config?.nombreEntidad?.toLowerCase() || 'registros')} registrados
                    </p>
                </div>
                <button
                    onClick={() => setShowForm(!showForm)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold flex items-center gap-2 transition-colors"
                >
                    <Plus className="w-5 h-5" />
                    Nuevo {config?.nombreEntidadSingular || 'Registro'}
                </button>
            </div>

            {showForm && (
                <div className="bg-white rounded-xl shadow-lg p-6">
                    <h3 className="text-xl font-bold mb-6">Agregar Nuevo {config?.nombreEntidadSingular || 'Registro'}</h3>
                    <form onSubmit={handleSubmit}>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Nombre <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    placeholder="Juan Carlos"
                                    value={formData.nombre}
                                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none transition-colors"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Apellido <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    placeholder="Pérez García"
                                    value={formData.apellido}
                                    onChange={(e) => setFormData({ ...formData, apellido: e.target.value })}
                                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none transition-colors"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Área <span className="text-red-500">*</span>
                                </label>
                                <select

                                    value={formData.area}
                                    onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none transition-colors"
                                    required
                                >
                                    <option value="">Seleccione área</option>
                                    {config && config.areas && config.areas.map((area, index) => (
                                        <option key={index} value={area}>{area}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Sede <span className="text-red-500">*</span>
                                </label>
                                <select
                                    value={formData.sede}
                                    onChange={(e) => setFormData({ ...formData, sede: e.target.value })}
                                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none transition-colors"
                                    required
                                >
                                    <option value="">Seleccione sede</option>
                                    {config && config.sedes && config.sedes.map((sede, index) => (
                                        <option key={index} value={sede}>{sede}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Teléfono <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="tel"
                                    placeholder="+51 999 888 777"
                                    value={formData.telefono}
                                    onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none transition-colors"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Email <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="email"
                                    placeholder="empleado@empresa.com"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none transition-colors"
                                />
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-3">
                            <button
                                type="submit"
                                className="flex-1 bg-green-500 hover:bg-green-600 text-white py-3 px-6 rounded-lg font-semibold flex items-center justify-center gap-2 transition-colors"
                            >
                                <Save className="w-5 h-5" />
                                Guardar {config?.nombreEntidadSingular || 'Registro'}
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setShowForm(false);
                                    setFormData({ nombre: '', apellido: '', area: '', sede: '', telefono: '', email: '' });
                                }}
                                className="bg-gray-200 hover:bg-gray-300 text-gray-700 py-3 px-8 rounded-lg font-semibold transition-colors"
                            >
                                Cancelar
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {employees.map(employee => (
                    <div key={employee.id} className="bg-white rounded-xl shadow-lg p-6">
                        <div className="flex items-start justify-between mb-4">
                            <div>
                                <h3 className="font-bold text-lg">{employee.nombre} {employee.apellido}</h3>
                                <p className="text-sm text-gray-600">{employee.id}</p>
                            </div>
                            <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full">
                                Activo
                            </span>
                        </div>

                        <div className="space-y-2 mb-4">
                            <p className="text-sm"><span className="font-semibold">Área:</span> {employee.area}</p>
                            <p className="text-sm"><span className="font-semibold">Sede:</span> {employee.sede}</p>
                            <p className="text-sm"><span className="font-semibold">Tel:</span> {employee.telefono}</p>
                            <p className="text-sm"><span className="font-semibold">Email:</span> {employee.email}</p>
                        </div>

                        <div className="border-t pt-4">
                            <div className="flex items-center justify-between mb-3">
                                <span className="text-sm font-semibold">Código QR:</span>
                                <button
                                    onClick={() => setSelectedEmployee(selectedEmployee?.id === employee.id ? null : employee)}
                                    className="text-blue-600 hover:text-blue-700 text-sm flex items-center gap-1"
                                >
                                    <Eye className="w-4 h-4" />
                                    {selectedEmployee?.id === employee.id ? 'Ocultar' : 'Ver'}
                                </button>
                            </div>

                            {selectedEmployee?.id === employee.id && (
                                <div className="bg-gray-50 p-4 rounded-lg mb-3">
                                    <div className="flex justify-center mb-3">
                                        <QRCode
                                            id={`qr-${employee.id}`}
                                            value={employee.qrCode}
                                            size={150}
                                            level="H"
                                        />
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => downloadQR(employee)}
                                            className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-2 px-3 rounded text-sm flex items-center justify-center gap-1"
                                        >
                                            <Download className="w-4 h-4" />
                                            Descargar
                                        </button>
                                        <button
                                            onClick={() => regenerarQR(employee.id)}
                                            className="flex-1 bg-orange-500 hover:bg-orange-600 text-white py-2 px-3 rounded text-sm flex items-center justify-center gap-1"
                                        >
                                            <QrCode className="w-4 h-4" />
                                            Regenerar
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

const Reportes = () => {
    const { employees, attendance, config } = useApp();
    const [selectedEmployee, setSelectedEmployee] = useState('');
    const [dateRange, setDateRange] = useState({ inicio: '', fin: '' });

    const getEmployeeAttendance = (employeeId) => {
        if (!employeeId) return null;

        const records = attendance.filter(a => a.employeeId === employeeId);
        const presentes = records.filter(r => r.estado === 'Presente').length;
        const tardanzas = records.filter(r => r.estado === 'Tardanza').length;
        const faltas = records.filter(r => r.estado === 'Falta').length;
        const total = records.length || 1;

        return {
            records,
            presentes,
            tardanzas,
            faltas,
            porcentaje: Math.round(((presentes + tardanzas) / total) * 100)
        };
    };

    const data = selectedEmployee ? getEmployeeAttendance(selectedEmployee) : null;

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">Reportes de Asistencia</h2>
                <p className="text-gray-600">Consulta y exporta reportes detallados</p>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                    <Filter className="w-5 h-5 text-blue-600" />
                    Filtros
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <select
                        value={selectedEmployee}
                        onChange={(e) => setSelectedEmployee(e.target.value)}
                        className="px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
                    >
                        <option value="">Seleccionar {config?.nombreEntidadSingular?.toLowerCase() || 'empleado'}</option>
                        {employees.map(emp => (
                            <option key={emp.id} value={emp.id}>
                                {emp.nombre} {emp.apellido} - {emp.area}
                            </option>
                        ))}
                    </select>

                    <input
                        type="date"
                        value={dateRange.inicio}
                        onChange={(e) => setDateRange({ ...dateRange, inicio: e.target.value })}
                        className="px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
                        placeholder="Fecha inicio"
                    />

                    <input
                        type="date"
                        value={dateRange.fin}
                        onChange={(e) => setDateRange({ ...dateRange, fin: e.target.value })}
                        className="px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
                        placeholder="Fecha fin"
                    />
                </div>
            </div>

            {data && (
                <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="bg-white p-6 rounded-xl shadow-lg">
                            <p className="text-gray-600 text-sm mb-1">Presentes</p>
                            <p className="text-3xl font-bold text-green-600">{data.presentes}</p>
                        </div>
                        <div className="bg-white p-6 rounded-xl shadow-lg">
                            <p className="text-gray-600 text-sm mb-1">Tardanzas</p>
                            <p className="text-3xl font-bold text-yellow-600">{data.tardanzas}</p>
                        </div>
                        <div className="bg-white p-6 rounded-xl shadow-lg">
                            <p className="text-gray-600 text-sm mb-1">Faltas</p>
                            <p className="text-3xl font-bold text-red-600">{data.faltas}</p>
                        </div>
                        <div className="bg-white p-6 rounded-xl shadow-lg">
                            <p className="text-gray-600 text-sm mb-1">% Asistencia</p>
                            <p className="text-3xl font-bold text-blue-600">{data.porcentaje}%</p>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-lg p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-xl font-bold">Detalle de Asistencias</h3>
                            <button className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2">
                                <Download className="w-4 h-4" />
                                Exportar PDF
                            </button>
                        </div>

                        {data.records.length > 0 ? (
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Fecha</th>
                                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Entrada</th>
                                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Salida</th>
                                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Estado</th>
                                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Método</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                        {data.records.map(record => (
                                            <tr key={record.id} className="hover:bg-gray-50">
                                                <td className="px-4 py-3 text-sm">{record.fecha}</td>
                                                <td className="px-4 py-3 text-sm">{record.horaEntrada || '-'}</td>
                                                <td className="px-4 py-3 text-sm">{record.horaSalida || '-'}</td>
                                                <td className="px-4 py-3">
                                                    <span className={`text-xs px-2 py-1 rounded-full ${record.estado === 'Presente' ? 'bg-green-100 text-green-700' :
                                                            record.estado === 'Tardanza' ? 'bg-yellow-100 text-yellow-700' :
                                                                'bg-red-100 text-red-700'
                                                        }`}>
                                                        {record.estado}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-sm">{record.metodoRegistro}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <p className="text-center text-gray-500 py-8">No hay registros para este empleado</p>
                        )}
                    </div>
                </>
            )}
        </div>
    );
};

const Justificaciones = () => {
    const { employees, attendance, registrarJustificacion, config } = useApp();
    const [selectedEmployee, setSelectedEmployee] = useState('');
    const [selectedDate, setSelectedDate] = useState('');
    const [motivo, setMotivo] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        registrarJustificacion(selectedEmployee, selectedDate, motivo);
        setSelectedEmployee('');
        setSelectedDate('');
        setMotivo('');
    };

    const faltasPendientes = attendance.filter(a => a.estado === 'Falta');

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">Justificaciones</h2>
                <p className="text-gray-600">{faltasPendientes.length} faltas pendientes de justificar</p>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-xl font-bold mb-4">Nueva Justificación</h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <select
                            value={selectedEmployee}
                            onChange={(e) => setSelectedEmployee(e.target.value)}
                            className="px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
                            required
                        >
                            <option value="">Seleccionar {config?.nombreEntidadSingular?.toLowerCase() || 'persona'}</option>
                            {employees.map(emp => (
                                <option key={emp.id} value={emp.id}>
                                    {emp.nombre} {emp.apellido}
                                </option>
                            ))}
                        </select>

                        <input
                            type="date"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                            className="px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
                            required
                        />
                    </div>

                    <textarea
                        value={motivo}
                        onChange={(e) => setMotivo(e.target.value)}
                        placeholder="Motivo de la justificación..."
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none resize-none"
                        rows="4"
                        required
                    ></textarea>

                    <button
                        type="submit"
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-semibold flex items-center justify-center gap-2"
                    >
                        <CheckCircle className="w-5 h-5" />
                        Registrar Justificación
                    </button>
                </form>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-xl font-bold mb-4">Historial de Justificaciones</h3>
                <div className="space-y-3">
                    {attendance.filter(a => a.justificacion).length > 0 ? (
                        attendance.filter(a => a.justificacion).map(record => {
                            const emp = employees.find(e => e.id === record.employeeId);
                            return (
                                <div key={record.id} className="border-2 border-gray-200 rounded-lg p-4">
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <p className="font-semibold">{emp?.nombre} {emp?.apellido}</p>
                                            <p className="text-sm text-gray-600">{record.fecha}</p>
                                            <p className="text-sm text-gray-700 mt-2">{record.justificacion}</p>
                                        </div>
                                        <span className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded-full">
                                            Justificado
                                        </span>
                                    </div>
                                </div>
                            );
                        })
                    ) : (
                        <p className="text-center text-gray-500 py-8">No hay justificaciones registradas</p>
                    )}
                </div>
            </div>
        </div>
    );
};

const Configuracion = () => {
    const { config, actualizarConfiguracion } = useApp();
    const [formConfig, setFormConfig] = useState({
        horaEntrada: '08:00',
        horaSalida: '18:00',
        toleranciaMinutos: 15,
        areas: [],
        sedes: [],
        whatsappEnabled: true,
        envioAutomaticoReportes: true
    });
    const [newArea, setNewArea] = useState('');
    const [newSede, setNewSede] = useState('');

    useEffect(() => {
        if (config) {
            setFormConfig(config);
        }
    }, [config]);

    const handleSave = () => {
        actualizarConfiguracion(formConfig);
    };

    const addArea = () => {
        if (newArea && !formConfig.areas.includes(newArea)) {
            setFormConfig({ ...formConfig, areas: [...formConfig.areas, newArea] });
            setNewArea('');
        }
    };

    const removeArea = (area) => {
        setFormConfig({ ...formConfig, areas: formConfig.areas.filter(a => a !== area) });
    };

    const addSede = () => {
        if (newSede && !formConfig.sedes.includes(newSede)) {
            setFormConfig({ ...formConfig, sedes: [...formConfig.sedes, newSede] });
            setNewSede('');
        }
    };

    const removeSede = (sede) => {
        setFormConfig({ ...formConfig, sedes: formConfig.sedes.filter(s => s !== sede) });
    };

    // Asegurarse de que las áreas y sedes sean arrays
    const safeAreas = Array.isArray(formConfig.areas) ? formConfig.areas : [];
    const safeSedes = Array.isArray(formConfig.sedes) ? formConfig.sedes : [];

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">Configuración</h2>
                <p className="text-gray-600">Administra los parámetros del sistema</p>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-xl font-bold mb-4">Horarios</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Hora de Entrada</label>
                        <input
                            type="time"
                            value={formConfig.horaEntrada || '08:00'}
                            onChange={(e) => setFormConfig({ ...formConfig, horaEntrada: e.target.value })}
                            className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Hora de Salida</label>
                        <input
                            type="time"
                            value={formConfig.horaSalida || '18:00'}
                            onChange={(e) => setFormConfig({ ...formConfig, horaSalida: e.target.value })}
                            className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Tolerancia (minutos)</label>
                        <input
                            type="number"
                            value={formConfig.toleranciaMinutos || 15}
                            onChange={(e) => setFormConfig({ ...formConfig, toleranciaMinutos: parseInt(e.target.value) })}
                            className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
                        />
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-xl font-bold mb-4">Personalización</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Nombre de la Entidad (Plural)
                        </label>
                        <input
                            type="text"
                            value={formConfig.nombreEntidad || 'Trabajadores'}
                            onChange={(e) => setFormConfig({ ...formConfig, nombreEntidad: e.target.value })}
                            placeholder="Ej: Trabajadores, Alumnos, Empleados"
                            className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                            Se mostrará en títulos y listados
                        </p>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Nombre de la Entidad (Singular)
                        </label>
                        <input
                            type="text"
                            value={formConfig.nombreEntidadSingular || 'Trabajador'}
                            onChange={(e) => setFormConfig({ ...formConfig, nombreEntidadSingular: e.target.value })}
                            placeholder="Ej: Trabajador, Alumno, Empleado"
                            className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                            Se mostrará en formularios y botones
                        </p>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-xl font-bold mb-4">Áreas</h3>
                <div className="flex gap-2 mb-4">
                    <input
                        type="text"
                        value={newArea}
                        onChange={(e) => setNewArea(e.target.value)}
                        placeholder="Nueva área..."
                        className="flex-1 px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
                    />
                    <button
                        onClick={addArea}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg flex items-center gap-2"
                    >
                        <Plus className="w-5 h-5" />
                        Agregar
                    </button>
                </div>
                <div className="flex flex-wrap gap-2">
                    {safeAreas.map((area, index) => (
                        <span key={index} className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm flex items-center gap-2">
                            {area}
                            <button onClick={() => removeArea(area)} className="hover:text-blue-900">
                                <X className="w-4 h-4" />
                            </button>
                        </span>
                    ))}
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-xl font-bold mb-4">Sedes</h3>
                <div className="flex gap-2 mb-4">
                    <input
                        type="text"
                        value={newSede}
                        onChange={(e) => setNewSede(e.target.value)}
                        placeholder="Nueva sede..."
                        className="flex-1 px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
                    />
                    <button
                        onClick={addSede}
                        className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg flex items-center gap-2"
                    >
                        <Plus className="w-5 h-5" />
                        Agregar
                    </button>
                </div>
                <div className="flex flex-wrap gap-2">
                    {safeSedes.map((sede, index) => (
                        <span key={index} className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm flex items-center gap-2">
                            {sede}
                            <button onClick={() => removeSede(sede)} className="hover:text-green-900">
                                <X className="w-4 h-4" />
                            </button>
                        </span>
                    ))}
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-xl font-bold mb-4">WhatsApp</h3>
                <div className="space-y-4">
                    <label className="flex items-center gap-3">
                        <input
                            type="checkbox"
                            checked={formConfig.whatsappEnabled || false}
                            onChange={(e) => setFormConfig({ ...formConfig, whatsappEnabled: e.target.checked })}
                            className="w-5 h-5"
                        />
                        <span className="text-gray-700">Habilitar integración con WhatsApp</span>
                    </label>
                    <label className="flex items-center gap-3">
                        <input
                            type="checkbox"
                            checked={formConfig.envioAutomaticoReportes || false}
                            onChange={(e) => setFormConfig({ ...formConfig, envioAutomaticoReportes: e.target.checked })}
                            className="w-5 h-5"
                        />
                        <span className="text-gray-700">Envío automático de reportes mensuales</span>
                    </label>
                </div>
            </div>

            <button
                onClick={handleSave}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-lg font-semibold text-lg flex items-center justify-center gap-2"
            >
                <Save className="w-6 h-6" />
                Guardar Configuración
            </button>
        </div>
    );
};

// ============================================
// MAIN APP
// ============================================


// ============================================
// APP CONTENT (Maneja autenticación)
// ============================================
const AppContent = () => {
  const { currentUser, loginUser, toast, hideToast } = useApp();
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [scannerMode, setScannerMode] = useState(false);

  const handleLogin = async (email, password) => {
    const result = await loginUser(email, password);
    return result;
  };

  const handleQRScan = () => {
    setScannerMode(true);
  };

  // Si no hay usuario logueado y no está en modo scanner → Mostrar Login
  if (!currentUser && !scannerMode) {
    return <Login onLoginSuccess={handleLogin} onQRScan={handleQRScan} />;
  }

  // Si está en modo scanner (sin login)
  if (scannerMode && !currentUser) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg p-8 text-center max-w-md">
          <Camera className="w-20 h-20 mx-auto mb-4 text-gray-400" />
          <h2 className="text-2xl font-bold mb-4">Scanner QR</h2>
          <p className="text-gray-600 mb-6">Implementación próximamente</p>
          <button
            onClick={() => setScannerMode(false)}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg"
          >
            Volver
          </button>
        </div>
      </div>
    );
  }

  // Usuario logueado → Mostrar dashboard
  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard': return <Dashboard />;
      case 'registro': return <Registro />;
      case 'reportes': return <Reportes />;
      case 'personal': return <Personal />;
      case 'justificaciones': return <Justificaciones />;
      case 'configuracion': return <Configuracion />;
      default: return <Dashboard />;
    }
  };

  return (
    <>
      <Layout currentPage={currentPage} onNavigate={setCurrentPage}>
        {renderPage()}
      </Layout>
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={hideToast}
        />
      )}
      <style>{`
        @keyframes slide-in {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        .animate-slide-in {
          animation: slide-in 0.3s ease-out;
        }
      `}</style>
    </>
  );
};

// ============================================
// MAIN APP
// ============================================
const App = () => {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
};

export default App;
