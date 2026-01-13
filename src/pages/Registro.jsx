import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
    Search, Camera, UserCheck, CheckCircle, Clock
} from 'lucide-react';
import { QRScanner } from '../components/attendance/QRScanner';

const Registro = () => {
    const { employees, registrarEntrada, registrarSalida, config } = useApp();
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
