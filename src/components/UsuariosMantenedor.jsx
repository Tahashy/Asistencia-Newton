import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import * as appsScript from '../services/appsScriptService';
import { User, Plus, Trash2, Mail, Lock, CheckCircle, AlertCircle, Edit2, X } from 'lucide-react';

const UsuariosMantenedor = () => {
    const { showToast } = useApp();
    const [usuarios, setUsuarios] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [editingId, setEditingId] = useState(null); // ID del usuario en modo edición
    
    const [formData, setFormData] = useState({
        nombre: '',
        email: '',
        password: '',
        confirmPassword: ''
    });

    useEffect(() => {
        cargarUsuarios();
    }, []);

    const cargarUsuarios = async () => {
        setLoading(true);
        try {
            const data = await appsScript.getAdminUsers();
            setUsuarios(data);
        } catch (error) {
            showToast("Error al cargar la lista de usuarios", "error");
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleEdit = (user) => {
        setEditingId(user.id);
        setFormData({
            nombre: user.nombre,
            email: user.email,
            password: '', // No cargamos la contraseña antigua por seguridad
            confirmPassword: ''
        });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleCancelEdit = () => {
        setEditingId(null);
        setFormData({ nombre: '', email: '', password: '', confirmPassword: '' });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!formData.nombre || !formData.email) {
            showToast("Por favor completa al menos el nombre y correo", "warning");
            return;
        }

        // Si no estamos editando, o si estamos editando y puso contraseña
        if (!editingId || formData.password) {
            if (formData.password !== formData.confirmPassword) {
                showToast("Las contraseñas no coinciden", "warning");
                return;
            }

            if (formData.password.length > 0 && formData.password.length < 6) {
                showToast("La contraseña debe tener al menos 6 caracteres", "warning");
                return;
            }
        }

        if (!editingId && !formData.password) {
            showToast("La contraseña es obligatoria para usuarios nuevos", "warning");
            return;
        }

        setIsSubmitting(true);
        try {
            if (editingId) {
                // Actualizar
                const result = await appsScript.updateAdminUser(editingId, formData.email, formData.password || undefined, formData.nombre);
                if (result.success) {
                    showToast("Usuario actualizado correctamente", "success");
                    handleCancelEdit();
                    await cargarUsuarios();
                } else {
                    showToast(result.error || "Error al actualizar el usuario.", "error");
                }
            } else {
                // Crear
                const result = await appsScript.createAdminUser(formData.email, formData.password, formData.nombre);
                if (result.success) {
                    showToast("Usuario creado correctamente", "success");
                    handleCancelEdit();
                    await cargarUsuarios();
                } else {
                    showToast(result.error || "Error al crear el usuario. Verifica que el correo no esté en uso.", "error");
                }
            }
        } catch (error) {
            showToast("Error de conexión con el servidor", "error");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id, nombre) => {
        if (window.confirm(`¿Estás seguro de eliminar el acceso para ${nombre}?`)) {
            try {
                const result = await appsScript.deleteAdminUser(id);
                if (result.success) {
                    showToast("Usuario eliminado correctamente", "success");
                    setUsuarios(usuarios.filter(u => u.id !== id));
                } else {
                    showToast("Error al eliminar usuario", "error");
                }
            } catch (error) {
                showToast("Error de conexión", "error");
            }
        }
    };

    return (
        <div className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 text-blue-800 rounded-xl p-4 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
                <p className="text-sm">
                    <strong>Nota importante:</strong> Los usuarios creados aquí tendrán acceso total al sistema como administradores. 
                    Asegúrate de haber desplegado las Edge Functions correspondientes (create-admin y update-admin).
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Formulario de Creación/Edición */}
                <div className="lg:col-span-1 bg-white rounded-xl shadow-lg p-6 border border-gray-100">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xl font-bold flex items-center gap-2 text-gray-800">
                            {editingId ? <Edit2 className="w-5 h-5 text-amber-500" /> : <Plus className="w-5 h-5 text-indigo-600" />}
                            {editingId ? 'Editar Administrador' : 'Nuevo Administrador'}
                        </h3>
                        {editingId && (
                            <button onClick={handleCancelEdit} className="text-gray-400 hover:text-gray-600">
                                <X className="w-5 h-5" />
                            </button>
                        )}
                    </div>
                    
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Nombre Completo</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <User className="w-4 h-4 text-gray-400" />
                                </div>
                                <input
                                    type="text"
                                    name="nombre"
                                    value={formData.nombre}
                                    onChange={handleInputChange}
                                    className="w-full pl-10 pr-4 py-2 border-2 border-gray-200 rounded-lg focus:border-indigo-500 focus:outline-none transition-colors"
                                    placeholder="Ej: Juan Pérez"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Correo Electrónico</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Mail className="w-4 h-4 text-gray-400" />
                                </div>
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleInputChange}
                                    className="w-full pl-10 pr-4 py-2 border-2 border-gray-200 rounded-lg focus:border-indigo-500 focus:outline-none transition-colors"
                                    placeholder="correo@ejemplo.com"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">
                                {editingId ? 'Nueva Contraseña (Opcional)' : 'Contraseña'}
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Lock className="w-4 h-4 text-gray-400" />
                                </div>
                                <input
                                    type="password"
                                    name="password"
                                    value={formData.password}
                                    onChange={handleInputChange}
                                    className="w-full pl-10 pr-4 py-2 border-2 border-gray-200 rounded-lg focus:border-indigo-500 focus:outline-none transition-colors"
                                    placeholder={editingId ? 'Déjalo vacío para no cambiarla' : 'Mínimo 6 caracteres'}
                                />
                            </div>
                        </div>

                        {(!editingId || formData.password) && (
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Confirmar Contraseña</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <CheckCircle className="w-4 h-4 text-gray-400" />
                                    </div>
                                    <input
                                        type="password"
                                        name="confirmPassword"
                                        value={formData.confirmPassword}
                                        onChange={handleInputChange}
                                        className="w-full pl-10 pr-4 py-2 border-2 border-gray-200 rounded-lg focus:border-indigo-500 focus:outline-none transition-colors"
                                        placeholder="Repite la contraseña"
                                    />
                                </div>
                            </div>
                        )}

                        <div className="flex gap-2 pt-2">
                            {editingId && (
                                <button
                                    type="button"
                                    onClick={handleCancelEdit}
                                    className="flex-1 py-3 rounded-lg font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 transition-all"
                                >
                                    Cancelar
                                </button>
                            )}
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className={`flex-[2] py-3 rounded-lg font-bold text-white transition-all shadow-md ${
                                    isSubmitting 
                                        ? 'bg-gray-400 cursor-not-allowed' 
                                        : editingId
                                            ? 'bg-amber-500 hover:bg-amber-600 hover:shadow-lg'
                                            : 'bg-indigo-600 hover:bg-indigo-700 hover:shadow-lg'
                                }`}
                            >
                                {isSubmitting ? 'Guardando...' : editingId ? 'Actualizar Usuario' : 'Crear Usuario'}
                            </button>
                        </div>
                    </form>
                </div>

                {/* Lista de Usuarios */}
                <div className="lg:col-span-2 bg-white rounded-xl shadow-lg p-6 border border-gray-100">
                    <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-gray-800">
                        <User className="w-5 h-5 text-indigo-600" />
                        Administradores Registrados
                    </h3>
                    
                    {loading ? (
                        <div className="flex justify-center items-center py-10">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                        </div>
                    ) : usuarios.length === 0 ? (
                        <div className="text-center py-10 text-gray-500">
                            <User className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                            <p>No se encontraron usuarios en la tabla perfiles.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-gray-50 text-gray-600 text-sm border-y border-gray-100">
                                        <th className="py-3 px-4 font-semibold">Nombre</th>
                                        <th className="py-3 px-4 font-semibold">Correo</th>
                                        <th className="py-3 px-4 font-semibold">Rol</th>
                                        <th className="py-3 px-4 font-semibold text-center">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {usuarios.map((user) => (
                                        <tr key={user.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                                            <td className="py-3 px-4">
                                                <div className="font-bold text-gray-800">{user.nombre}</div>
                                            </td>
                                            <td className="py-3 px-4 text-gray-600 text-sm">{user.email}</td>
                                            <td className="py-3 px-4">
                                                <span className="bg-indigo-100 text-indigo-700 text-xs font-bold px-2 py-1 rounded-full uppercase">
                                                    {user.rol || 'ADMIN'}
                                                </span>
                                            </td>
                                            <td className="py-3 px-4 text-center">
                                                <div className="flex items-center justify-center gap-1">
                                                    <button 
                                                        onClick={() => handleEdit(user)}
                                                        className="text-amber-500 hover:bg-amber-50 p-2 rounded-lg transition-colors"
                                                        title="Editar usuario"
                                                    >
                                                        <Edit2 className="w-4 h-4" />
                                                    </button>
                                                    <button 
                                                        onClick={() => handleDelete(user.id, user.nombre)}
                                                        className="text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors"
                                                        title="Eliminar usuario"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default UsuariosMantenedor;
