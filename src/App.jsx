import React, { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider, useApp } from './context/AppContext';

// Components
import { Login } from './components/Login';
import Layout from './components/layout/Layout';
import Toast from './components/ui/Toast';
import { QRScanner } from './components/attendance/QRScanner';

// Pages
import Dashboard from './pages/Dashboard';
import Registro from './pages/Registro';
import Reportes from './pages/Reportes';
import Personal from './pages/Personal';
import Justificaciones from './pages/Justificaciones';
import Configuracion from './pages/Configuracion';
import Academico from './pages/Academico';

import * as appsScript from './services/appsScriptService';

export const matchEmployeeQR = (qrData, employeesList) => {
    if (!qrData || !employeesList || employeesList.length === 0) return null;
    const raw = String(qrData).trim();
    const rawLower = raw.toLowerCase();
    const extractedId = raw.includes('-QR-HASH-') ? raw.split('-QR-HASH-')[0].trim() : raw;
    const extractedIdLower = extractedId.toLowerCase();
    const numericOnlyExtracted = extractedId.replace(/\D/g, '');

    return employeesList.find(e => {
        if (!e) return false;
        const code = String(e.qrCode || e.qr_code || '').trim();
        const codeLower = code.toLowerCase();
        const id = String(e.id || '').trim();
        const idLower = id.toLowerCase();
        const numericOnlyId = id.replace(/\D/g, '');

        if (code && (code === raw || codeLower === rawLower)) return true;
        if (id && (id === raw || idLower === rawLower)) return true;
        if (id && (id === extractedId || idLower === extractedIdLower)) return true;

        if (numericOnlyExtracted && numericOnlyId && numericOnlyExtracted === numericOnlyId) return true;

        if (code && rawLower.includes(codeLower)) return true;
        if (id && rawLower.includes(idLower)) return true;
        if (id && extractedIdLower.includes(idLower)) return true;
        if (code && codeLower.includes(extractedIdLower)) return true;

        return false;
    });
};

const AppContent = () => {
    const {
        currentUser, loginUser, toast, hideToast, employees, attendance,
        registrarAsistencia, registrarEntrada, registrarSalida, 
        getCurrentDate, showToast
    } = useApp();
    const [scannerMode, setScannerMode] = useState(false);

    const handleLogin = async (email, password) => {
        const result = await loginUser(email, password);
        return result;
    };

    const handleQRScan = () => {
        setScannerMode(true);
    };

    const handleScanSuccess = async (qrData) => {
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

        if (!employee) {
            const raw = String(qrData).trim();
            const tag = raw.includes('-QR-HASH-') ? raw.split('-QR-HASH-')[0] : raw.slice(0, 15);
            showToast(`Código QR no reconocido (${tag})`, 'error');
            setScannerMode(false);
            return;
        }

        const hoy = getCurrentDate();
        const registrosHoy = attendance.filter(a => a.employeeId === employee.id && a.fecha === hoy);
        const esDobleTurno = employee.turno === 'Doble Turno';
        const maxRegistros = esDobleTurno ? 2 : 1;

        if (registrosHoy.length >= maxRegistros) {
            showToast(`${employee.nombre} ya completó sus asistencias de hoy (${registrosHoy.length}/${maxRegistros})`, 'info');
        } else {
            await registrarEntrada(employee.id, 'QR');
        }

        // NO CERRAMOS EL ESCÁNER: Permitimos escaneos múltiples seguidos
        // setScannerMode(false); 
    };



    return (
        <>
            {/* Vistas principales basadas en estado */}
            {!currentUser && !scannerMode && (
                <Login onLoginSuccess={handleLogin} onQRScan={handleQRScan} />
            )}

            {scannerMode && !currentUser && (
                <QRScanner
                    onScanSuccess={handleScanSuccess}
                    onClose={() => setScannerMode(false)}
                    isMultiScan={true}
                />
            )}

            {currentUser && (
                <Layout>
                    <Routes>
                        <Route path="/" element={<Navigate to="/dashboard" replace />} />
                        <Route path="/dashboard" element={<Dashboard />} />
                        <Route path="/registro" element={<Registro />} />
                        <Route path="/reportes" element={<Reportes />} />
                        <Route path="/personal" element={<Personal />} />
                        <Route path="/justificaciones" element={<Justificaciones />} />
                        <Route path="/configuracion" element={<Configuracion />} />
                        <Route path="/academico" element={<Academico />} />
                        <Route path="*" element={<Navigate to="/dashboard" replace />} />
                    </Routes>
                </Layout>
            )}

            {/* Toast Global - Accesible desde cualquier vista */}
            {toast && (
                <Toast
                    message={toast.message}
                    type={toast.type}
                    onClose={hideToast}
                />
            )}

            <style>{`
                @keyframes slide-in {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                .animate-slide-in {
                    animation: slide-in 0.3s ease-out;
                }
            `}</style>
        </>
    );
};

const App = () => {
    return (
        <AppProvider>
            <AppContent />
        </AppProvider>
    );
};

export default App;
