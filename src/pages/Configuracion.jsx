import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import {
    Plus, X, Save, Calendar, Clock, Users, Settings
} from 'lucide-react';
import UsuariosMantenedor from '../components/UsuariosMantenedor';

const diasSemana = [
    { id: 1, name: 'Lunes' },
    { id: 2, name: 'Martes' },
    { id: 3, name: 'Miércoles' },
    { id: 4, name: 'Jueves' },
    { id: 5, name: 'Viernes' },
    { id: 6, name: 'Sábado' },
    { id: 0, name: 'Domingo' }
];

const Configuracion = () => {
    const { config, actualizarConfiguracion, showToast } = useApp();
    const [formConfig, setFormConfig] = useState({
        toleranciaMinutos: 15,
        areas: [],
        sedes: [],
        turnos: [
            { nombre: 'Mañana', hora_entrada: '08:00', hora_salida: '14:00' },
            { nombre: 'Tarde', hora_entrada: '14:00', hora_salida: '20:00' }
        ],
        diasLaborales: [1, 2, 3, 4, 5],
        whatsappEnabled: true,
        envioAutomaticoReportes: true
    });
    const [newArea, setNewArea] = useState('');
    const [newSede, setNewSede] = useState('');
    
    // Estado para nuevo turno
    const [newTurno, setNewTurno] = useState({ nombre: '', hora_entrada: '08:00', hora_salida: '18:00' });
    
    // Estado para tabs
    const [activeTab, setActiveTab] = useState('general');

    useEffect(() => {
        if (config) {
            setFormConfig({
                ...formConfig,
                ...config,
                turnos: config.turnos && config.turnos.length > 0 ? config.turnos : formConfig.turnos,
                diasLaborales: config.diasLaborales || [1, 2, 3, 4, 5]
            });
        }
    }, [config]);

    const handleSave = () => {
        // VALIDACIÓN
        if (!formConfig.nombreEntidadPlural || formConfig.nombreEntidadPlural.trim() === '') {
            showToast('Por favor ingresa el nombre de la entidad en plural (Ej: Trabajadores)', 'warning');
            return;
        }
        if (!formConfig.nombreEntidadSingular || formConfig.nombreEntidadSingular.trim() === '') {
            showToast('Por favor ingresa el nombre de la entidad en singular (Ej: Trabajador)', 'warning');
            return;
        }

        actualizarConfiguracion(formConfig);
    };

    const toggleDiaLaboral = (diaId) => {
        const currentDias = formConfig.diasLaborales || [];
        if (currentDias.includes(diaId)) {
            setFormConfig({ ...formConfig, diasLaborales: currentDias.filter(id => id !== diaId) });
        } else {
            setFormConfig({ ...formConfig, diasLaborales: [...currentDias, diaId] });
        }
    };

    const addArea = () => {
        const currentAreas = Array.isArray(formConfig.areas) ? formConfig.areas : [];
        if (newArea && !currentAreas.includes(newArea)) {
            setFormConfig({ ...formConfig, areas: [...currentAreas, newArea] });
            setNewArea('');
        }
    };

    const removeArea = (area) => {
        const currentAreas = Array.isArray(formConfig.areas) ? formConfig.areas : [];
        setFormConfig({ ...formConfig, areas: currentAreas.filter(a => a !== area) });
    };

    const addSede = () => {
        const currentSedes = Array.isArray(formConfig.sedes) ? formConfig.sedes : [];
        if (newSede && !currentSedes.includes(newSede)) {
            setFormConfig({ ...formConfig, sedes: [...currentSedes, newSede] });
            setNewSede('');
        }
    };

    const removeSede = (sede) => {
        const currentSedes = Array.isArray(formConfig.sedes) ? formConfig.sedes : [];
        setFormConfig({ ...formConfig, sedes: currentSedes.filter(s => s !== sede) });
    };

    const addTurno = () => {
        if (!newTurno.nombre || !newTurno.hora_entrada || !newTurno.hora_salida) {
            showToast('Completa todos los datos del turno', 'warning');
            return;
        }
        const currentTurnos = Array.isArray(formConfig.turnos) ? formConfig.turnos : [];
        if (!currentTurnos.find(t => t.nombre === newTurno.nombre)) {
            setFormConfig({ ...formConfig, turnos: [...currentTurnos, { ...newTurno }] });
            setNewTurno({ nombre: '', hora_entrada: '08:00', hora_salida: '18:00' });
        } else {
            showToast('Ese nombre de turno ya existe', 'warning');
        }
    };

    const removeTurno = (nombreTurno) => {
        const currentTurnos = Array.isArray(formConfig.turnos) ? formConfig.turnos : [];
        setFormConfig({ ...formConfig, turnos: currentTurnos.filter(t => t.nombre !== nombreTurno) });
    };

    const safeAreas = Array.isArray(formConfig.areas) ? formConfig.areas : [];
    const safeSedes = Array.isArray(formConfig.sedes) ? formConfig.sedes : [];
    const safeTurnos = Array.isArray(formConfig.turnos) ? formConfig.turnos : [];

    return (
        <div className="space-y-6 pb-20">
            <div>
                <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">Configuración</h2>
                <p className="text-gray-600">Administra los parámetros del sistema y usuarios</p>
            </div>

            {/* PESTAÑAS */}
            <div className="flex space-x-2 border-b border-gray-200">
                <button
                    onClick={() => setActiveTab('general')}
                    className={`py-3 px-6 font-bold text-sm flex items-center gap-2 border-b-2 transition-colors ${
                        activeTab === 'general'
                            ? 'border-indigo-600 text-indigo-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                >
                    <Settings className="w-4 h-4" />
                    General
                </button>
                <button
                    onClick={() => setActiveTab('usuarios')}
                    className={`py-3 px-6 font-bold text-sm flex items-center gap-2 border-b-2 transition-colors ${
                        activeTab === 'usuarios'
                            ? 'border-indigo-600 text-indigo-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                >
                    <Users className="w-4 h-4" />
                    Usuarios (Admins)
                </button>
            </div>

            {activeTab === 'general' && (
                <div className="space-y-6">
                    {/* REGLAS DE ASISTENCIA */}
                    <div className="bg-white rounded-xl shadow-lg p-6">
                        <h3 className="text-xl font-bold mb-4">Reglas Generales</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Tolerancia de Tardanza (minutos) *</label>
                                <input
                                    type="number"
                                    value={formConfig.toleranciaMinutos || 15}
                                    onChange={(e) => setFormConfig({ ...formConfig, toleranciaMinutos: parseInt(e.target.value) })}
                                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
                                    title="Los minutos extras que un empleado puede demorar después de su hora de entrada antes de ser marcado como Tardanza."
                                />
                                <p className="text-xs text-gray-500 mt-1">Minutos extra antes de marcar Tardanza.</p>
                            </div>
                        </div>
                    </div>

                    {/* TURNOS Y HORARIOS */}
                    <div className="bg-white rounded-xl shadow-lg p-6">
                        <div className="flex items-center gap-2 mb-4">
                            <Clock className="w-5 h-5 text-indigo-600" />
                            <h3 className="text-xl font-bold">Turnos y Horarios</h3>
                        </div>
                        <p className="text-sm text-gray-500 mb-6">
                            Define los horarios de cada turno. El sistema usará la hora de entrada del turno del empleado más la tolerancia global para calcular las tardanzas.
                        </p>
                        
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-2 mb-4 items-end bg-gray-50 p-4 rounded-xl border border-gray-200">
                            <div className="col-span-1 md:col-span-1">
                                <label className="block text-xs font-semibold text-gray-600 mb-1">Nombre (Ej: Noche)</label>
                                <input
                                    type="text"
                                    value={newTurno.nombre}
                                    onChange={(e) => setNewTurno({ ...newTurno, nombre: e.target.value })}
                                    className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 outline-none text-sm"
                                />
                            </div>
                            <div className="col-span-1 md:col-span-1">
                                <label className="block text-xs font-semibold text-gray-600 mb-1">Hora Entrada</label>
                                <input
                                    type="time"
                                    value={newTurno.hora_entrada}
                                    onChange={(e) => setNewTurno({ ...newTurno, hora_entrada: e.target.value })}
                                    className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 outline-none text-sm"
                                />
                            </div>
                            <div className="col-span-1 md:col-span-1">
                                <label className="block text-xs font-semibold text-gray-600 mb-1">Hora Salida</label>
                                <input
                                    type="time"
                                    value={newTurno.hora_salida}
                                    onChange={(e) => setNewTurno({ ...newTurno, hora_salida: e.target.value })}
                                    className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 outline-none text-sm"
                                />
                            </div>
                            <div className="col-span-1 md:col-span-1">
                                <button onClick={addTurno} className="w-full bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-indigo-700 transition-colors">
                                    Añadir Turno
                                </button>
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-gray-100 text-gray-700 text-sm">
                                        <th className="p-3 rounded-tl-lg">Turno</th>
                                        <th className="p-3">Entrada</th>
                                        <th className="p-3">Salida</th>
                                        <th className="p-3 rounded-tr-lg">Acción</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {safeTurnos.map((t, idx) => (
                                        <tr key={idx} className="border-b border-gray-100 text-sm">
                                            <td className="p-3 font-semibold text-gray-800">{t.nombre}</td>
                                            <td className="p-3 text-gray-600">{t.hora_entrada}</td>
                                            <td className="p-3 text-gray-600">{t.hora_salida}</td>
                                            <td className="p-3">
                                                <button onClick={() => removeTurno(t.nombre)} className="text-red-500 hover:bg-red-50 p-2 rounded-lg">
                                                    <X className="w-4 h-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* DÍAS LABORALES */}
                    <div className="bg-white rounded-xl shadow-lg p-6">
                        <div className="flex items-center gap-2 mb-4">
                            <Calendar className="w-5 h-5 text-indigo-600" />
                            <h3 className="text-xl font-bold">Días Laborales</h3>
                        </div>
                        <p className="text-sm text-gray-500 mb-6">
                            Selecciona los días en los que se debe registrar asistencia. Los días no seleccionados no sumarán faltas.
                        </p>
                        <div className="flex flex-wrap gap-3">
                            {diasSemana.map((dia) => {
                                const isSelected = formConfig.diasLaborales?.includes(dia.id);
                                return (
                                    <button
                                        key={dia.id}
                                        onClick={() => toggleDiaLaboral(dia.id)}
                                        className={`px-6 py-3 rounded-xl font-bold transition-all border-2 ${isSelected
                                                ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-100'
                                                : 'bg-white border-gray-200 text-gray-500 hover:border-indigo-300'
                                            }`}
                                    >
                                        {dia.name}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* PERSONALIZACIÓN */}
                    <div className="bg-white rounded-xl shadow-lg p-6">
                        <h3 className="text-xl font-bold mb-4">Personalización (UI)</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Nombre de la Entidad (Plural) *</label>
                                <input
                                    type="text"
                                    value={formConfig.nombreEntidadPlural || ''}
                                    onChange={(e) => setFormConfig({ ...formConfig, nombreEntidadPlural: e.target.value })}
                                    placeholder="Ej: Trabajadores, Alumnos"
                                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Nombre de la Entidad (Singular) *</label>
                                <input
                                    type="text"
                                    value={formConfig.nombreEntidadSingular || ''}
                                    onChange={(e) => setFormConfig({ ...formConfig, nombreEntidadSingular: e.target.value })}
                                    placeholder="Ej: Trabajador, Alumno"
                                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
                                />
                            </div>
                        </div>
                    </div>

                    {/* ÁREAS Y SEDES */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-white rounded-xl shadow-lg p-6">
                            <h3 className="text-xl font-bold mb-4">Áreas</h3>
                            <div className="flex gap-2 mb-4">
                                <input
                                    type="text"
                                    value={newArea}
                                    onChange={(e) => setNewArea(e.target.value)}
                                    className="flex-1 px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
                                />
                                <button onClick={addArea} className="bg-blue-600 text-white px-4 py-2 rounded-lg"><Plus /></button>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {safeAreas.map((area, idx) => (
                                    <span key={idx} className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-2">
                                        {area}
                                        <X className="w-4 h-4 cursor-pointer" onClick={() => removeArea(area)} />
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
                                    className="flex-1 px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
                                />
                                <button onClick={addSede} className="bg-green-600 text-white px-4 py-2 rounded-lg"><Plus /></button>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {safeSedes.map((sede, idx) => (
                                    <span key={idx} className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-2">
                                        {sede}
                                        <X className="w-4 h-4 cursor-pointer" onClick={() => removeSede(sede)} />
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={handleSave}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 shadow-lg shadow-blue-100"
                    >
                        <Save className="w-6 h-6" />
                        Guardar Configuración
                    </button>
                </div>
            )}

            {activeTab === 'usuarios' && (
                <UsuariosMantenedor />
            )}
        </div>
    );
};

export default Configuracion;
