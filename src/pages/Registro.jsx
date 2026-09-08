import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
    Search, Camera, UserCheck, CheckCircle, Clock, LogIn, LogOut, AlertCircle
} from 'lucide-react';
import { QRScanner } from '../components/attendance/QRScanner';

const Registro = () => {
    const { employees, attendance, registrarEntrada, registrarSalida, config, getCurrentDate, isLoading } = useApp();
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

    const handleScan = (qrData) => {
        const employee = employees.find(e => e.qrCode === qrData);
        if (employee) {
            setSelectedEmployee(employee);
            setScanMode(false);
        }
    };

    // Obtener el estado real del empleado seleccionado para HOY
    // Esto evita que el botón "Registrar Entrada" dispare una salida por error
    const getEstadoHoy = (employee) => {
        if (!employee) return null;
        const hoy = getCurrentDate();

        const registrosHoy = attendance
            .filter(a => a.employeeId === employee.id && a.fecha === hoy)
            .sort((a, b) => (b.horaEntrada || '').localeCompare(a.horaEntrada || ''));

        if (registrosHoy.length === 0) return { estado: 'SIN_REGISTRO' };

        const ultimoSinSalida = registrosHoy.find(r => !r.horaSalida);
        if (ultimoSinSalida) {
            return { estado: 'CON_ENTRADA', registro: ultimoSinSalida };
        }

        // Todos tienen salida — verificar si es Doble Turno con turno pendiente
        const esDobleTurno = employee.turno === 'Doble Turno';
        if (esDobleTurno && registrosHoy.length < 2) {
            return { estado: 'SIN_REGISTRO' }; // Puede registrar el segundo turno
        }

        return { estado: 'COMPLETO', registros: registrosHoy };
    };

    const estadoHoy = getEstadoHoy(selectedEmployee);

    const handleAccion = async (tipo) => {
        if (!selectedEmployee || isLoading) return;
        if (tipo === 'entrada') {
            await registrarEntrada(selectedEmployee.id, 'Manual');
        } else {
            await registrarSalida(selectedEmployee.id, 'Manual');
        }
        setSelectedEmployee(null);
        setSearchTerm('');
    };

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">Registrar Asistencia</h2>
                <p className="text-gray-600">Registra entrada y salida de {config?.nombreEntidad?.toLowerCase() || 'personal'}</p>
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
                        const tieneSalida = registrosHoy.length > 0 && registrosHoy.every(r => r.horaSalida);
                        const tieneEntrada = registrosHoy.length > 0 && registrosHoy.some(r => r.horaEntrada);

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
                                    {/* Badge de estado del día */}
                                    {tieneSalida ? (
                                        <span className="text-xs font-bold bg-green-100 text-green-700 px-2 py-1 rounded-full">Completo ✓</span>
                                    ) : tieneEntrada ? (
                                        <span className="text-xs font-bold bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full">En turno</span>
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

                    {/* Panel informativo de estado actual */}
                    {estadoHoy.estado === 'CON_ENTRADA' && (
                        <div className="flex items-center gap-3 bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                            <Clock className="w-5 h-5 text-yellow-600 flex-shrink-0" />
                            <div>
                                <p className="text-sm font-bold text-yellow-800">
                                    Entrada registrada a las {estadoHoy.registro?.horaEntrada || '-'}
                                </p>
                                <p className="text-xs text-yellow-700">Falta registrar la salida.</p>
                            </div>
                        </div>
                    )}

                    {estadoHoy.estado === 'COMPLETO' && (
                        <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
                            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                            <div>
                                <p className="text-sm font-bold text-green-800">Asistencia completa del día</p>
                                <p className="text-xs text-green-700">
                                    Entrada: {estadoHoy.registros?.[estadoHoy.registros.length - 1]?.horaEntrada || '-'} · Salida: {estadoHoy.registros?.[0]?.horaSalida || '-'}
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Botones inteligentes según estado */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* ENTRADA: habilitado solo si no tiene registro hoy */}
                        <button
                            onClick={() => handleAccion('entrada')}
                            disabled={isLoading || estadoHoy.estado !== 'SIN_REGISTRO'}
                            title={
                                estadoHoy.estado === 'CON_ENTRADA' ? 'Este empleado ya tiene entrada registrada' :
                                estadoHoy.estado === 'COMPLETO' ? 'Este empleado ya completó su jornada' : ''
                            }
                            className={`font-semibold py-4 px-6 rounded-lg transition-all flex items-center justify-center gap-2 ${
                                estadoHoy.estado === 'SIN_REGISTRO' && !isLoading
                                    ? 'bg-green-500 hover:bg-green-600 text-white shadow-md active:scale-95 cursor-pointer'
                                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            }`}
                        >
                            <LogIn className="w-5 h-5" />
                            {isLoading ? 'Registrando...' : 'Registrar Entrada'}
                        </button>

                        {/* SALIDA: habilitado solo si tiene entrada pendiente de salida */}
                        <button
                            onClick={() => handleAccion('salida')}
                            disabled={isLoading || estadoHoy.estado !== 'CON_ENTRADA'}
                            title={
                                estadoHoy.estado === 'SIN_REGISTRO' ? 'Primero debe registrar la entrada' :
                                estadoHoy.estado === 'COMPLETO' ? 'Este empleado ya completó su jornada' : ''
                            }
                            className={`font-semibold py-4 px-6 rounded-lg transition-all flex items-center justify-center gap-2 ${
                                estadoHoy.estado === 'CON_ENTRADA' && !isLoading
                                    ? 'bg-blue-500 hover:bg-blue-600 text-white shadow-md active:scale-95 cursor-pointer'
                                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            }`}
                        >
                            <LogOut className="w-5 h-5" />
                            {isLoading ? 'Registrando...' : 'Registrar Salida'}
                        </button>
                    </div>

                    {estadoHoy.estado === 'COMPLETO' && (
                        <p className="text-center text-sm text-gray-500 mt-4 flex items-center justify-center gap-1">
                            <AlertCircle className="w-4 h-4" />
                            Este empleado ya completó su asistencia hoy.
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
