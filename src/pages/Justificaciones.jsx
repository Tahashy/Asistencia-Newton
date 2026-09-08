import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
    CheckCircle
} from 'lucide-react';

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

    // Calcular ausencias reales de los últimos 30 días laborales.
    // Las "Faltas" no se insertan en Supabase (son virtuales), por eso
    // hay que calcularlas comparando empleados vs registros existentes.
    const calcularFaltasPendientes = () => {
        const diasLaborales = config?.diasLaborales || [1, 2, 3, 4, 5];
        const empleadosActivos = employees.filter(e => e.activo);
        const hoy = new Date();
        let count = 0;

        for (let i = 1; i <= 30; i++) {
            const dia = new Date(hoy);
            dia.setDate(hoy.getDate() - i);
            const diaNum = dia.getDay();

            // Solo días laborales
            if (!diasLaborales.includes(diaNum)) continue;

            const fechaStr = `${dia.getFullYear()}-${String(dia.getMonth() + 1).padStart(2, '0')}-${String(dia.getDate()).padStart(2, '0')}`;

            empleadosActivos.forEach(emp => {
                // Si no tiene registro ese día (ni justificado), es falta pendiente
                const tieneRegistro = attendance.some(
                    a => a.employeeId === emp.id && a.fecha === fechaStr
                );
                if (!tieneRegistro) count++;
            });
        }
        return count;
    };

    const totalFaltasPendientes = calcularFaltasPendientes();


    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">Justificaciones</h2>
                <p className="text-gray-600">{totalFaltasPendientes} {totalFaltasPendientes === 1 ? 'falta pendiente' : 'faltas pendientes'} de justificar (últimos 30 días)</p>
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

export default Justificaciones;
