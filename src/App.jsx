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
        const employee = employees.find(e => e.qrCode === qrData);

        if (!employee) {
            showToast('Código QR no reconocido', 'error');
            setScannerMode(false);
            return;
        }

        const hoy = getCurrentDate();
        const registroHoy = attendance.find(a => a.employeeId === employee.id && a.fecha === hoy);

        if (!registroHoy || !registroHoy.horaSalida || registroHoy.horaSalida === '-') {
            // El servidor decidirá si es ENTRADA (si no hay fila) o SALIDA (si hay fila sin salida)
            await registrarAsistencia(employee.id, 'QR');
        } else {
            showToast(`${employee.nombre} ya completó su asistencia de hoy`, 'info');
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
