import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
    Search, Camera, UserCheck, CheckCircle, Clock, LogIn, AlertCircle
} from 'lucide-react';
import { QRScanner } from '../components/attendance/QRScanner';

import { matchEmployeeQR } from '../App';
import * as appsScript from '../services/appsScriptService';

const Registro = () => {
    const { employees, attendance, registrarEntrada, config, getCurrentDate, isLoading, showToast } = useApp();
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedEmployee, setSelectedEmployee] = useState(null);
    const [scanMode, setScanMode] = useState(false);

    const filteredEmployees = employees.filter(e =>
        e.activo && (
            (e.nombre || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (e.apellido || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (e.area || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (e.sede || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (e.id || '').toLowerCase().includes(searchTerm.toLowerCase())
        )
    );

    const handleScan = async (qrData) => {
        if (!qrData) return;
        
        let employee = matchEmployeeQR(qrData, employees);

        if (!employee) {
            try {
                const freshEmployees = await appsScript.getEmployees();
                employee = matchEmployeeQR(qrData, freshEmployees);
            } catch (err) {
                console.error("Error al refrescar empleados para QR:", err);
            }
        }

        if (employee) {
            setSelectedEmployee(employee);
            setScanMode(false);
        } else {
            const raw = String(qrData).trim();
            const tag = raw.includes('-QR-HASH-') ? raw.split('-QR-HASH-')[0] : raw.slice(0, 15);
            showToast && showToast(`Código QR no reconocido (${tag})`, 'error');
        }
    };



    // Evaluación de asistencias según el turno (Max 1 o Max 2 para Doble Turno)
    const getEstadoHoy = (employee) => {
        if (!employee) return null;
        const hoy = getCurrentDate();
        const registrosHoy = attendance.filter(a => a.employeeId === employee.id && a.fecha === hoy);
        const esDobleTurno = employee.turno === 'Doble Turno';
        const reg = registrosHoy[0];

        if (!reg) {
            return { estado: 'SIN_REGISTRO', count: 0, max: esDobleTurno ? 2 : 1, esDobleTurno };
        }

        const tieneSegundoTurno = Boolean(reg.horaSalida && reg.horaSalida !== '-');

        if (esDobleTurno && !tieneSegundoTurno) {
            return { estado: 'TURNO_PENDIENTE', count: 1, max: 2, esDobleTurno, registro: reg, registros: [reg] };
        }

        return { estado: 'YA_REGISTRADO', count: esDobleTurno ? 2 : 1, max: esDobleTurno ? 2 : 1, esDobleTurno, registro: reg, registros: [reg] };
    };

    const estadoHoy = getEstadoHoy(selectedEmployee);

    const handleAccion = async () => {
        if (!selectedEmployee || isLoading) return;
        await registrarEntrada(selectedEmployee.id, 'Manual');
        setSelectedEmployee(null);
        setSearchTerm('');
    };

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">Registrar Asistencia</h2>
                <p className="text-gray-600">Registra la asistencia de {config?.nombreEntidad?.toLowerCase() || 'personal'}</p>
            </div>

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
                    {filteredEmployees.map(employee => {
                        const hoy = getCurrentDate();
                        const registrosHoy = attendance.filter(a => a.employeeId === employee.id && a.fecha === hoy);
                        const esDobleTurno = employee.turno === 'Doble Turno';
                        const reg = registrosHoy[0];
                        const tieneEntrada = Boolean(reg);
                        const tieneSegunda = Boolean(reg?.horaSalida && reg?.horaSalida !== '-');

                        const yaCompleto = esDobleTurno ? tieneSegunda : tieneEntrada;
                        const esParcial = esDobleTurno && tieneEntrada && !tieneSegunda;

                        return (
                            <div
                                key={employee.id}
                                onClick={() => setSelectedEmployee(employee)}
                                className={`p-4 border-2 rounded-lg cursor-pointer transition-all hover:shadow-md ${
                                    selectedEmployee?.id === employee.id
                                        ? 'border-blue-500 bg-blue-50'
                                        : 'border-gray-200 hover:border-blue-300'
                                }`}
                            >
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="font-semibold text-lg">{employee.nombre} {employee.apellido}</p>
                                        <p className="text-sm text-gray-600">{employee.id} • {employee.area || 'Sin área'} • {employee.sede || 'Sin sede'}</p>
                                    </div>
                                    {yaCompleto ? (
                                        <span className="text-xs font-bold bg-green-100 text-green-700 px-2 py-1 rounded-full">
                                            {esDobleTurno ? '2/2 Completo ✓' : 'Presente ✓'}
                                        </span>
                                    ) : esParcial ? (
                                        <span className="text-xs font-bold bg-amber-100 text-amber-700 px-2 py-1 rounded-full">
                                            1/2 (Tarde pend.)
                                        </span>
                                    ) : (
                                        <UserCheck className="w-6 h-6 text-gray-400" />
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {selectedEmployee && estadoHoy && (
                <div className="bg-white rounded-xl shadow-lg p-6">
                    <h3 className="text-xl font-bold mb-4">Registrar para:</h3>
                    <div className="bg-blue-50 p-4 rounded-lg mb-6">
                        <p className="font-semibold text-lg">{selectedEmployee.nombre} {selectedEmployee.apellido}</p>
                        <p className="text-sm text-gray-600">{selectedEmployee.area || 'Sin área'} - {selectedEmployee.sede || 'Sin sede'}</p>
                        <p className="text-xs text-gray-500 mt-1">ID: {selectedEmployee.id} · Turno: {selectedEmployee.turno || 'Mañana'}</p>
                    </div>

                    {/* Banner para Turno Pendiente (Doble Turno) */}
                    {estadoHoy.estado === 'TURNO_PENDIENTE' && (
                        <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
                            <Clock className="w-5 h-5 text-amber-600 flex-shrink-0" />
                            <div>
                                <p className="text-sm font-bold text-amber-800">
                                    1ª Asistencia (Mañana) registrada a las {estadoHoy.registro?.horaEntrada || '-'}
                                </p>
                                <p className="text-xs text-amber-700">Falta registrar la 2ª Asistencia del Turno Tarde.</p>
                            </div>
                        </div>
                    )}

                    {/* Banner si ya completó todas las asistencias del día */}
                    {estadoHoy.estado === 'YA_REGISTRADO' && (
                        <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
                            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                            <div>
                                <p className="text-sm font-bold text-green-800">
                                    {estadoHoy.esDobleTurno ? 'Asistencias completas del Doble Turno (2/2)' : 'Asistencia ya registrada hoy'}
                                </p>
                                <p className="text-xs text-green-700">
                                    {estadoHoy.esDobleTurno
                                        ? `1º Turno: ${estadoHoy.registro?.horaEntrada || '-'} · 2º Turno: ${estadoHoy.registro?.horaSalida || '-'}`
                                        : `Entrada: ${estadoHoy.registro?.horaEntrada || '-'}`
                                    }
                                </p>
                            </div>
                        </div>
                    )}


                    {/* Botón de entrada */}
                    <button
                        onClick={handleAccion}
                        disabled={isLoading || estadoHoy.estado === 'YA_REGISTRADO'}
                        title={estadoHoy.estado === 'YA_REGISTRADO' ? 'Este alumno ya completó su asistencia hoy' : ''}
                        className={`w-full font-semibold py-4 px-6 rounded-lg transition-all flex items-center justify-center gap-2 ${
                            estadoHoy.estado !== 'YA_REGISTRADO' && !isLoading
                                ? 'bg-green-500 hover:bg-green-600 text-white shadow-md active:scale-95 cursor-pointer'
                                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        }`}
                    >
                        <LogIn className="w-5 h-5" />
                        {isLoading
                            ? 'Registrando...'
                            : estadoHoy.estado === 'TURNO_PENDIENTE'
                                ? 'Registrar 2ª Entrada (Turno Tarde)'
                                : 'Registrar Entrada'
                        }
                    </button>

                    {estadoHoy.estado === 'YA_REGISTRADO' && (
                        <p className="text-center text-sm text-gray-500 mt-4 flex items-center justify-center gap-1">
                            <AlertCircle className="w-4 h-4" />
                            Este alumno ya completó su asistencia hoy.
                        </p>
                    )}
                </div>
            )}


            {scanMode && (
                <QRScanner
                    onScanSuccess={handleScan}
                    onClose={() => setScanMode(false)}
                />
            )}
        </div>
    );
};

export default Registro;

