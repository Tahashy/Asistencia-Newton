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

        if (esDobleTurno) {
            const now = new Date();
            const esTarde = now.getHours() >= 13;
            const hasMorning = registrosHoy.some(r => parseInt(r.horaEntrada?.split(':')[0] || 0) < 13);
            
            const tieneSegundoTurno = registrosHoy.length >= 2 || Boolean(reg.horaSalida && reg.horaSalida !== '-');
            
            if (!tieneSegundoTurno) {
                if (!esTarde && hasMorning) {
                    return { estado: 'ESPERANDO_TARDE', count: 1, max: 2, esDobleTurno, registro: reg, registros: registrosHoy };
                }
                return { estado: 'TURNO_PENDIENTE', count: 1, max: 2, esDobleTurno, registro: reg, registros: registrosHoy };
            }
            return { estado: 'YA_REGISTRADO', count: 2, max: 2, esDobleTurno, registro: reg, registros: registrosHoy };
        }

        return { estado: 'YA_REGISTRADO', count: 1, max: 1, esDobleTurno, registro: reg, registros: registrosHoy };
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
                        const st = getEstadoHoy(employee);
                        const esDobleTurno = employee.turno === 'Doble Turno';

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
                                    {st.estado === 'YA_REGISTRADO' ? (
                                        <span className="text-xs font-bold bg-green-100 text-green-700 px-2 py-1 rounded-full">
                                            {esDobleTurno ? '2/2 Completo ✓' : 'Presente ✓'}
                                        </span>
                                    ) : st.estado === 'TURNO_PENDIENTE' ? (
                                        <div className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 border border-yellow-200 shadow-sm">
                                            <span className="w-1.5 h-1.5 bg-yellow-500 rounded-full animate-pulse"></span>
                                            {st.count}/{st.max} (Tarde pend.)
                                        </div>
                                    ) : st.estado === 'ESPERANDO_TARDE' ? (
                                        <div className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 border border-orange-200 shadow-sm">
                                            <Clock className="w-3 h-3" />
                                            {st.count}/{st.max} (Vuelva en la tarde)
                                        </div>
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

                    {/* Banner para Esperando Tarde (Doble Turno) */}
                    {estadoHoy.estado === 'ESPERANDO_TARDE' && (
                        <div className="flex items-center gap-3 bg-orange-50 border border-orange-200 rounded-lg p-3 mb-4">
                            <Clock className="w-5 h-5 text-orange-600 flex-shrink-0" />
                            <div>
                                <p className="text-sm font-bold text-orange-800">
                                    1ª Asistencia registrada a las {estadoHoy.registro?.horaEntrada || '-'}
                                </p>
                                <p className="text-xs text-orange-700">Aún no es la hora de la tarde (vuelva a partir de la 1:00 PM).</p>
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
                                        ? `1º Turno: ${estadoHoy.registros[0]?.horaEntrada || '-'} · 2º Turno: ${estadoHoy.registros[1]?.horaEntrada || estadoHoy.registros[0]?.horaSalida || '-'}`
                                        : `Entrada: ${estadoHoy.registro?.horaEntrada || '-'}`
                                    }
                                </p>
                            </div>
                        </div>
                    )}


                    {/* Botones de acción según estado */}
                    {estadoHoy.estado === 'SIN_REGISTRO' || estadoHoy.estado === 'TURNO_PENDIENTE' ? (
                        <button
                            onClick={handleAccion}
                            disabled={isLoading}
                            className={`w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg ${
                                isLoading 
                                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                                    : estadoHoy.estado === 'TURNO_PENDIENTE'
                                        ? 'bg-yellow-500 hover:bg-yellow-600 text-white shadow-yellow-200'
                                        : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-200'
                            }`}
                        >
                            {isLoading ? (
                                <div className="animate-spin rounded-full h-5 w-5 border-2 border-current border-t-transparent" />
                            ) : (
                                <>
                                    <CheckCircle className="w-5 h-5" />
                                    {estadoHoy.estado === 'TURNO_PENDIENTE' ? 'Registrar Turno Tarde' : 'Registrar Entrada'}
                                </>
                            )}
                        </button>
                    ) : estadoHoy.estado === 'ESPERANDO_TARDE' ? (
                        <div className="w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2 bg-gray-100 text-gray-500 border-2 border-gray-200 border-dashed">
                            <Clock className="w-5 h-5" />
                            Vuelva a partir de la 1:00 PM
                        </div>
                    ) : (
                        <div className="w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2 bg-green-50 text-green-600 border-2 border-green-200">
                            <CheckCircle className="w-5 h-5" />
                            {estadoHoy.esDobleTurno ? 'Ambos turnos completados' : 'Asistencia Completada'}
                        </div>
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

