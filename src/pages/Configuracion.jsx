import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import {
    Plus, X, Save, Calendar
} from 'lucide-react';

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
    const { config, actualizarConfiguracion } = useApp();
    const [formConfig, setFormConfig] = useState({
        horaEntrada: '08:00',
        horaSalida: '18:00',
        toleranciaMinutos: 15,
        areas: [],
        sedes: [],
        diasLaborales: [1, 2, 3, 4, 5], // Lunes a Viernes por defecto
        whatsappEnabled: true,
        envioAutomaticoReportes: true
    });
    const [newArea, setNewArea] = useState('');
    const [newSede, setNewSede] = useState('');

    useEffect(() => {
        if (config) {
            setFormConfig({
                ...formConfig,
                ...config,
                diasLaborales: config.diasLaborales || [1, 2, 3, 4, 5]
            });
        }
    }, [config]);

    const handleSave = () => {
        actualizarConfiguracion(formConfig);
    };

    const toggleDiaLaboral = (diaId) => {
        const currentDias = formConfig.diasLaborales || [];
        if (currentDias.includes(diaId)) {
            setFormConfig({
                ...formConfig,
                diasLaborales: currentDias.filter(id => id !== diaId)
            });
        } else {
            setFormConfig({
                ...formConfig,
                diasLaborales: [...currentDias, diaId]
            });
        }
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

    const safeAreas = Array.isArray(formConfig.areas) ? formConfig.areas : [];
    const safeSedes = Array.isArray(formConfig.sedes) ? formConfig.sedes : [];

    return (
        <div className="space-y-6 pb-20">
            <div>
                <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">Configuración</h2>
                <p className="text-gray-600">Administra los parámetros del sistema</p>
            </div>

            {/* HORARIOS */}
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
                <h3 className="text-xl font-bold mb-4">Personalización</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Nombre de la Entidad (Plural)</label>
                        <input
                            type="text"
                            value={formConfig.nombreEntidad || ''}
                            onChange={(e) => setFormConfig({ ...formConfig, nombreEntidad: e.target.value })}
                            placeholder="Ej: Trabajadores, Alumnos"
                            className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Nombre de la Entidad (Singular)</label>
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

            {/* WHATSAPP */}
            <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-xl font-bold mb-4">WhatsApp</h3>
                <div className="space-y-4">
                    <label className="flex items-center gap-3 cursor-pointer p-2 hover:bg-gray-50 rounded-lg">
                        <input
                            type="checkbox"
                            checked={formConfig.whatsappEnabled || false}
                            onChange={(e) => setFormConfig({ ...formConfig, whatsappEnabled: e.target.checked })}
                            className="w-5 h-5 accent-blue-600"
                        />
                        <span className="text-gray-700 font-medium">Habilitar integración con WhatsApp</span>
                    </label>
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
    );
};

export default Configuracion;
