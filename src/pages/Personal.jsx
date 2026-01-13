import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
    Plus, Save, Download, QrCode, Eye, X, Mail, Phone, MapPin, Briefcase, Edit, UserPlus, RefreshCw, Trash2
} from 'lucide-react';
import QRCode from '../components/ui/QRCode';
import Pagination from '../components/ui/Pagination';

const Personal = () => {
    const { employees, agregarEmpleado, regenerarQR, config, actualizarEmpleado, isLoading } = useApp();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedEmployee, setSelectedEmployee] = useState(null);
    const [isEditing, setIsEditing] = useState(false);

    // Paginación
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 7;

    const [formData, setFormData] = useState({
        id: '',
        nombre: '',
        apellido: '',
        area: '',
        sede: '',
        telefono: '',
        email: '',
        cargo: ''
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

    const resetForm = () => {
        setFormData({
            id: '',
            nombre: '',
            apellido: '',
            area: '',
            sede: '',
            telefono: '',
            email: '',
            cargo: ''
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

    // Lógica de Paginación
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentEmployees = employees.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(employees.length / itemsPerPage);

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
                <button
                    onClick={() => { resetForm(); setIsModalOpen(true); }}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl flex items-center justify-center gap-2 font-bold transition-all shadow-lg shadow-blue-200 active:scale-95"
                >
                    <UserPlus className="w-5 h-5" />
                    Añadir {config?.nombreEntidadSingular || 'Personal'}
                </button>
            </div>

            {/* TABLA DE PERSONAL */}
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100 animate-in fade-in duration-500">
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
                                            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                                                {employee.nombre[0]}{employee.apellido[0]}
                                            </div>
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
                                            <p className="text-xs text-gray-500 flex items-center gap-2">
                                                <MapPin className="w-3.5 h-3.5 text-gray-400" />
                                                {employee.sede || 'Sin sede'}
                                            </p>
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
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Sede</label>
                                    <select
                                        value={formData.sede}
                                        onChange={(e) => setFormData({ ...formData, sede: e.target.value })}
                                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl transition-all outline-none focus:border-blue-500"
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
        </div>
    );
};

export default Personal;
