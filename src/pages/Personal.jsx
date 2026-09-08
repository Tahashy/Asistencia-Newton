import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
    Plus, Save, Download, QrCode, Eye, X, Mail, Phone, MapPin, Briefcase, Edit, UserPlus, RefreshCw, Trash2, Camera, Search, Filter
} from 'lucide-react';
import QRCode from '../components/ui/QRCode';
import Pagination from '../components/ui/Pagination';

const Personal = () => {
    const { employees, agregarEmpleado, eliminarEmpleado, regenerarQR, config, actualizarEmpleado, isLoading, eliminarTodo } = useApp();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedEmployee, setSelectedEmployee] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [employeeToDelete, setEmployeeToDelete] = useState(null);
    const [isDeletingAll, setIsDeletingAll] = useState(false);

    // Búsqueda y Filtros
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedSedeFilter, setSelectedSedeFilter] = useState('');
    const [selectedAreaFilter, setSelectedAreaFilter] = useState('');
    const [selectedTurnoFilter, setSelectedTurnoFilter] = useState('');

    // Paginación
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(7);

    const [formData, setFormData] = useState({
        id: '',
        nombre: '',
        apellido: '',
        area: '',
        sede: '',
        telefono: '',
        email: '',
        cargo: '',
        turno: 'Mañana',
        fotoFile: null,
        fotoPreview: null
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (isEditing) {
            const res = await actualizarEmpleado(formData.id, formData);
            if (res.success) {
                setIsModalOpen(false);
                resetForm();
            }
        } else {
            const res = await agregarEmpleado(formData);
            if (res.success) {
                setIsModalOpen(false);
                resetForm();
            }
        }
    };

    const handleEdit = (employee) => {
        setFormData(employee);
        setIsEditing(true);
        setIsModalOpen(true);
    };

    const handleDelete = (employee) => {
        setEmployeeToDelete(employee);
        setIsDeleting(true);
    };

    const confirmDelete = async () => {
        if (!employeeToDelete) return;
        const res = await eliminarEmpleado(employeeToDelete.id);
        if (res.success) {
            setIsDeleting(false);
            setEmployeeToDelete(null);
        }
    };

    const confirmDeleteAll = async () => {
        const res = await eliminarTodo();
        if (res.success) {
            setIsDeletingAll(false);
            setCurrentPage(1);
        }
    };

    const resetForm = () => {
        setFormData({
            id: '',
            nombre: '',
            apellido: '',
            area: '',
            sede: '',
            telefono: '',
            email: '',
            cargo: '',
            turno: 'Mañana',
            fotoFile: null,
            fotoPreview: null
        });
        setIsEditing(false);
    };

    const handleDownloadQR = (id, name) => {
        const canvas = document.getElementById(id);
        if (canvas) {
            const pngUrl = canvas
                .toDataURL("image/png")
                .replace("image/png", "image/octet-stream");
            let downloadLink = document.createElement("a");
            downloadLink.href = pngUrl;
            downloadLink.download = `QR_${name}.png`;
            document.body.appendChild(downloadLink);
            downloadLink.click();
            document.body.removeChild(downloadLink);
        }
    };

    // Filtrado y Búsqueda
    const filteredEmployees = employees.filter(employee => {
        const fullName = `${employee.nombre} ${employee.apellido}`.toLowerCase();
        const matchesSearch = fullName.includes(searchTerm.toLowerCase());
        const matchesSede = selectedSedeFilter === '' || employee.sede === selectedSedeFilter;
        const matchesArea = selectedAreaFilter === '' || employee.area === selectedAreaFilter;
        const matchesTurno = selectedTurnoFilter === '' || employee.turno === selectedTurnoFilter;
        return matchesSearch && matchesSede && matchesArea && matchesTurno;
    });

    // Lógica de Paginación
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentEmployees = filteredEmployees.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredEmployees.length / itemsPerPage);

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">
                        Gestión de {config?.nombreEntidad || 'Personal'}
                    </h2>
                    <p className="text-gray-600">
                        {employees.length} {employees.length === 1 ? (config?.nombreEntidadSingular || 'registro') : (config?.nombreEntidadPlural?.toLowerCase() || 'registros')} registrados
                    </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3">
                    {/* BOTON DE PELIGRO - VACIAR TODO */}
                    <button
                        onClick={() => setIsDeletingAll(true)}
                        className="bg-red-50 hover:bg-red-100 text-red-600 px-4 py-3 rounded-xl flex items-center justify-center gap-2 font-bold transition-all border border-red-200 active:scale-95"
                        title="Purgar o Vaciar el sistema por completo"
                    >
                        <Trash2 className="w-5 h-5" />
                        <span className="hidden xl:inline">Resetear Sistema</span>
                    </button>

                    <button
                        onClick={() => { resetForm(); setIsModalOpen(true); }}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl flex items-center justify-center gap-2 font-bold transition-all shadow-lg shadow-blue-200 active:scale-95"
                    >
                        <UserPlus className="w-5 h-5" />
                        Añadir {config?.nombreEntidadSingular || 'Personal'}
                    </button>
                </div>
            </div>

            {/* TABLA DE PERSONAL */}
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100 animate-in fade-in duration-500">
                {/* Filtros y Búsqueda */}
                <div className="p-6 border-b border-gray-100 bg-white grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Buscador por nombre */}
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Search className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                            type="text"
                            placeholder="Buscar por nombre o apellido..."
                            value={searchTerm}
                            onChange={(e) => {
                                setSearchTerm(e.target.value);
                                setCurrentPage(1);
                            }}
                            className="pl-10 w-full px-4 py-2.5 border border-gray-200 rounded-xl transition-all outline-none focus:border-blue-500"
                        />
                    </div>

                    {/* Filtro por Sede */}
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Filter className="h-5 w-5 text-gray-400" />
                        </div>
                        <select
                            value={selectedSedeFilter}
                            onChange={(e) => { setSelectedSedeFilter(e.target.value); setCurrentPage(1); }}
                            className="pl-10 w-full px-4 py-2.5 border border-gray-200 rounded-xl transition-all outline-none focus:border-blue-500 bg-white"
                        >
                            <option value="">Todas las Sedes</option>
                            {config?.sedes?.map((s, i) => <option key={i} value={s}>{s}</option>)}
                        </select>
                    </div>

                    {/* Filtro por Área */}
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Briefcase className="h-5 w-5 text-gray-400" />
                        </div>
                        <select
                            value={selectedAreaFilter}
                            onChange={(e) => { setSelectedAreaFilter(e.target.value); setCurrentPage(1); }}
                            className="pl-10 w-full px-4 py-2.5 border border-gray-200 rounded-xl transition-all outline-none focus:border-blue-500 bg-white"
                        >
                            <option value="">Todas las Áreas</option>
                            {config?.areas?.map((a, i) => <option key={i} value={a}>{a}</option>)}
                        </select>
                    </div>

                    {/* Filtro por Turno */}
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <MapPin className="h-5 w-5 text-gray-400" />
                        </div>
                        <select
                            value={selectedTurnoFilter}
                            onChange={(e) => { setSelectedTurnoFilter(e.target.value); setCurrentPage(1); }}
                            className="pl-10 w-full px-4 py-2.5 border border-gray-200 rounded-xl transition-all outline-none focus:border-blue-500 bg-white"
                        >
                            <option value="">Todos los Turnos</option>
                            {config?.turnos?.map((t, i) => (
                                <option key={i} value={t.nombre || t}>{t.nombre || t}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Controles superiores de tabla */}
                <div className="px-6 py-4 flex justify-between items-center bg-gray-50/50 border-b border-gray-100">
                    <div className="flex items-center gap-3 text-sm">
                        <span className="font-semibold text-gray-500 uppercase tracking-wider text-xs">Mostrar</span>
                        <select
                            value={itemsPerPage}
                            onChange={(e) => {
                                setItemsPerPage(Number(e.target.value));
                                setCurrentPage(1); // Volver al inicio al cambiar el tamaño de cantidad
                            }}
                            className="border border-gray-200 rounded-lg px-3 py-1.5 outline-none hover:border-blue-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-50 bg-white shadow-sm transition-all text-sm font-bold text-gray-700 cursor-pointer"
                        >
                            <option value={7}>7 filas</option>
                            <option value={15}>15 filas</option>
                            <option value={30}>30 filas</option>
                            <option value={50}>50 filas</option>
                            <option value={100}>100 filas</option>
                        </select>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50/50 border-b border-gray-100">
                                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Nombre y Apellido</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">ID / Código</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Detalles</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Contacto</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider text-center">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {currentEmployees.map((employee) => (
                                <tr key={employee.id} className="hover:bg-blue-50/30 transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            {employee.foto_url ? (
                                                <img src={employee.foto_url} alt={employee.nombre} className="w-10 h-10 rounded-full object-cover border-2 border-blue-100" />
                                            ) : (
                                                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                                                    {employee.nombre?.[0]}{employee.apellido?.[0]}
                                                </div>
                                            )}
                                            <div>
                                                <p className="font-bold text-gray-800">{employee.nombre} {employee.apellido}</p>
                                                <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${employee.activo ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                    {employee.activo ? 'Activo' : 'Inactivo'}
                                                </span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded text-gray-600">
                                            {employee.id}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="space-y-1">
                                            <p className="text-sm text-gray-700 flex items-center gap-2">
                                                <Briefcase className="w-3.5 h-3.5 text-gray-400" />
                                                {employee.area || 'Sin área'}
                                            </p>
                                            <div className="flex items-center gap-2">
                                                <p className="text-xs text-gray-500 flex items-center gap-2">
                                                    <MapPin className="w-3.5 h-3.5 text-gray-400" />
                                                    {employee.sede || 'Sin sede'}
                                                </p>
                                                <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                                                    employee.turno === 'Tarde' ? 'bg-orange-100 text-orange-700' :
                                                    employee.turno === 'Doble Turno' ? 'bg-purple-100 text-purple-700' :
                                                    'bg-blue-100 text-blue-700'
                                                }`}>
                                                    {employee.turno || 'Mañana'}
                                                </span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="space-y-1">
                                            {employee.telefono && (
                                                <p className="text-sm text-gray-700 flex items-center gap-2">
                                                    <Phone className="w-3.5 h-3.5 text-gray-400" />
                                                    {employee.telefono}
                                                </p>
                                            )}
                                            {employee.email && (
                                                <p className="text-xs text-gray-500 flex items-center gap-2">
                                                    <Mail className="w-3.5 h-3.5 text-gray-400" />
                                                    {employee.email}
                                                </p>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <div className="flex items-center justify-center gap-2">
                                            <button
                                                onClick={() => setSelectedEmployee(employee)}
                                                className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-all"
                                                title="Ver Código QR"
                                            >
                                                <QrCode className="w-5 h-5" />
                                            </button>
                                            <button
                                                onClick={() => handleEdit(employee)}
                                                className="p-2 text-amber-600 hover:bg-amber-100 rounded-lg transition-all"
                                                title="Editar"
                                            >
                                                <Edit className="w-5 h-5" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(employee)}
                                                className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-all"
                                                title="Eliminar"
                                            >
                                                <Trash2 className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                />
            </div>

            {/* MODAL PARA AÑADIR/EDITAR */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-300">
                        <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-gray-50/50">
                            <h3 className="text-xl font-bold text-gray-800">
                                {isEditing ? 'Editar' : 'Añadir'} {config?.nombreEntidadSingular || 'Personal'}
                            </h3>
                            <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-400">
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6">
                            
                            {/* Selector de Foto */}
                            <div className="flex flex-col items-center justify-center mb-6">
                                <div className="relative group cursor-pointer" onClick={() => document.getElementById('fotoInput').click()}>
                                    {formData.fotoPreview || (isEditing && formData.foto_url) ? (
                                        <img 
                                            src={formData.fotoPreview || formData.foto_url} 
                                            alt="Preview" 
                                            className="w-24 h-24 rounded-full object-cover border-4 border-blue-50 shadow-md"
                                        />
                                    ) : (
                                        <div className="w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center border-4 border-gray-50 shadow-inner">
                                            <Camera className="w-8 h-8 text-gray-400" />
                                        </div>
                                    )}
                                    <div className="absolute inset-0 bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                        <Camera className="w-6 h-6 text-white" />
                                    </div>
                                </div>
                                <p className="text-xs text-gray-500 mt-2 font-medium">Subir foto (Opcional)</p>
                                <input
                                    id="fotoInput"
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={(e) => {
                                        const file = e.target.files[0];
                                        if (file) {
                                            const previewUrl = URL.createObjectURL(file);
                                            setFormData({ ...formData, fotoFile: file, fotoPreview: previewUrl });
                                        }
                                    }}
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Nombre</label>
                                    <input
                                        required
                                        type="text"
                                        value={formData.nombre}
                                        onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl transition-all outline-none focus:border-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Apellido</label>
                                    <input
                                        required
                                        type="text"
                                        value={formData.apellido}
                                        onChange={(e) => setFormData({ ...formData, apellido: e.target.value })}
                                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl transition-all outline-none focus:border-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Área</label>
                                    <select
                                        value={formData.area}
                                        onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl transition-all outline-none focus:border-blue-500"
                                    >
                                        <option value="">Seleccionar Área</option>
                                        {config?.areas?.map((a, i) => <option key={i} value={a}>{a}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Turno</label>
                                    <select
                                        value={formData.turno || 'Mañana'}
                                        onChange={(e) => setFormData({ ...formData, turno: e.target.value })}
                                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl transition-all outline-none focus:border-blue-500 bg-white"
                                    >
                                        {(() => {
                                            const turnosBase = config?.turnos && config.turnos.length > 0
                                                ? config.turnos.map(t => typeof t === 'string' ? { nombre: t } : t)
                                                : [{ nombre: 'Mañana' }, { nombre: 'Tarde' }, { nombre: 'Doble Turno' }];

                                            const nombresExistentes = turnosBase.map(t => t.nombre);
                                            const turnosFinales = [...turnosBase];

                                            if (!nombresExistentes.includes('Doble Turno')) {
                                                turnosFinales.push({ nombre: 'Doble Turno' });
                                            }

                                            return turnosFinales.map((t, i) => (
                                                <option key={i} value={t.nombre}>{t.nombre}</option>
                                            ));
                                        })()}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Sede</label>
                                    <select
                                        value={formData.sede}
                                        onChange={(e) => setFormData({ ...formData, sede: e.target.value })}
                                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl transition-all outline-none focus:border-blue-500 bg-white"
                                    >
                                        <option value="">Seleccionar Sede</option>
                                        {config?.sedes?.map((s, i) => <option key={i} value={s}>{s}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Teléfono</label>
                                    <input
                                        type="text"
                                        value={formData.telefono}
                                        onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl transition-all outline-none focus:border-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Email</label>
                                    <input
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl transition-all outline-none focus:border-blue-500"
                                    />
                                </div>
                            </div>
                            <div className="flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-6 py-2.5 text-gray-600 font-bold hover:bg-gray-100 rounded-xl transition-all"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-2.5 rounded-xl font-bold transition-all shadow-lg shadow-blue-200 disabled:opacity-50"
                                >
                                    {isLoading ? 'Guardando...' : isEditing ? 'Actualizar' : 'Guardar'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL PARA VER QR */}
            {selectedEmployee && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-300 relative border-8 border-gray-50">
                        <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-br from-blue-600 to-indigo-700" />

                        <div className="relative pt-12 pb-8 px-8 text-center">
                            <button
                                onClick={() => setSelectedEmployee(null)}
                                className="absolute top-4 right-4 p-2 bg-white/20 hover:bg-white/30 rounded-full transition-colors text-white"
                            >
                                <X className="w-5 h-5" />
                            </button>

                            <div className="w-24 h-24 bg-white rounded-3xl shadow-xl mx-auto flex items-center justify-center mb-6 border-4 border-white relative z-10 overflow-hidden">
                                <span className="text-3xl font-black text-blue-600">
                                    {selectedEmployee.nombre[0]}{selectedEmployee.apellido[0]}
                                </span>
                            </div>

                            <h3 className="text-2xl font-black text-gray-800 mb-1">{selectedEmployee.nombre} {selectedEmployee.apellido}</h3>
                            <p className="text-blue-600 font-bold text-sm tracking-widest uppercase mb-8">Personal ID: {selectedEmployee.id}</p>

                            <div className="bg-gray-50 p-6 rounded-3xl mb-8 border-2 border-dashed border-gray-200 flex justify-center group relative">
                                <QRCode
                                    id={`qr-${selectedEmployee.id}`}
                                    value={selectedEmployee.qrCode}
                                    size={200}
                                />
                                <div className="absolute inset-0 bg-blue-600/5 opacity-0 group-hover:opacity-100 transition-opacity rounded-3xl" />
                            </div>

                            <div className="flex flex-col gap-3">
                                <button
                                    onClick={() => handleDownloadQR(`qr-${selectedEmployee.id}`, `${selectedEmployee.nombre}_${selectedEmployee.apellido}`)}
                                    className="bg-blue-600 hover:bg-blue-700 text-white w-full py-4 rounded-2xl flex items-center justify-center gap-3 font-bold transition-all shadow-xl shadow-blue-100 active:scale-95"
                                >
                                    <Download className="w-5 h-5" />
                                    Descargar Código QR
                                </button>

                                <button
                                    onClick={() => regenerarQR(selectedEmployee.id)}
                                    className="text-gray-500 hover:text-blue-600 hover:bg-blue-50 w-full py-3 rounded-2xl flex items-center justify-center gap-2 font-bold transition-all"
                                >
                                    <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                                    Regenerar Identificador
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL DE CONFIRMACIÓN DE ELIMINACIÓN */}
            {isDeleting && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-300">
                        <div className="p-6 text-center">
                            <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Trash2 className="w-8 h-8" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-800 mb-2">¿Seguro de eliminar?</h3>
                            <p className="text-gray-600 mb-6">
                                Esta acción eliminará a <span className="font-bold text-gray-800">{employeeToDelete?.nombre} {employeeToDelete?.apellido}</span> permanentemente del sistema.
                            </p>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => { setIsDeleting(false); setEmployeeToDelete(null); }}
                                    className="flex-1 px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold rounded-xl transition-all"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={confirmDelete}
                                    disabled={isLoading}
                                    className="flex-1 px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-red-200 disabled:opacity-50"
                                >
                                    {isLoading ? 'Eliminando...' : 'Sí, Eliminar'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL CRITICO DE ELIMINAR TODO */}
            {isDeletingAll && (
                <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-300 border-2 border-red-100">
                        <div className="p-8 text-center">
                            <div className="w-20 h-20 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner shadow-red-200">
                                <Trash2 className="w-10 h-10 animate-bounce" />
                            </div>
                            <h3 className="text-2xl font-black text-gray-800 mb-3 uppercase tracking-wider">¡Alerta Nivel Rojo!</h3>
                            <p className="text-gray-600 mb-2">
                                Estás a punto de borrar <strong>completamente</strong> la base de datos de tu colegio/empresa.
                            </p>
                            <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-8 text-sm text-red-700 text-left">
                                <p className="font-bold mb-2">Se borrará de forma irrecuperable:</p>
                                <ul className="list-disc list-inside space-y-1">
                                    <li>Absolutamente todos los alumnos/personal.</li>
                                    <li>Todo el historial histórico de asistencias y faltas.</li>
                                    <li>Los códigos QR actuales quedarán inútiles.</li>
                                </ul>
                            </div>
                            <div className="flex flex-col sm:flex-row gap-3">
                                <button
                                    onClick={() => setIsDeletingAll(false)}
                                    className="flex-1 px-6 py-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl transition-all"
                                >
                                    ¡Cancelar Ahora Mismo!
                                </button>
                                <button
                                    onClick={confirmDeleteAll}
                                    disabled={isLoading}
                                    className="flex-1 px-6 py-4 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-red-200 disabled:opacity-50"
                                >
                                    {isLoading ? 'Purgando sistema...' : 'Sí, Destruir Todo'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Personal;
