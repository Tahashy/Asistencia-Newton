import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Camera, X, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';

export const QRScanner = ({ onScanSuccess, onClose }) => {
    const [error, setError] = useState('');
    const [isStopping, setIsStopping] = useState(false);
    const [isScanning, setIsScanning] = useState(false);
    const [facingMode, setFacingMode] = useState('environment');
    const html5QrCodeRef = useRef(null);
    const mountedRef = useRef(true);
    const scannerStateRef = useRef('IDLE'); // IDLE, STARTING, SCANNING, STOPPING

    const stopScanner = async (result = null) => {
        if (!html5QrCodeRef.current || scannerStateRef.current === 'STOPPING' || scannerStateRef.current === 'IDLE') {
            if (result && mountedRef.current) onScanSuccess(result);
            return;
        }

        scannerStateRef.current = 'STOPPING';
        if (mountedRef.current) setIsStopping(true);

        try {
            const currentState = html5QrCodeRef.current.getState();
            if (currentState === 2 || currentState === 3) {
                await html5QrCodeRef.current.stop();
            }
            
            // Verificamos si el elemento todavía existe antes de limpiar
            if (html5QrCodeRef.current && document.getElementById("qr-reader")) {
                await html5QrCodeRef.current.clear();
            }
        } catch (err) {
            console.log('Finalizando sesión de escáner...');
        } finally {
            html5QrCodeRef.current = null;
            scannerStateRef.current = 'IDLE';
            if (mountedRef.current) {
                setIsScanning(false);
                if (result) onScanSuccess(result);
            }
        }
    };

    const startScanner = async (mode = facingMode) => {
        if (scannerStateRef.current !== 'IDLE') return;
        
        try {
            setError('');
            scannerStateRef.current = 'STARTING';
            if (mountedRef.current) setIsScanning(false);

            const element = document.getElementById("qr-reader");
            if (!element) return;

            // 1. Permiso
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ video: true });
                stream.getTracks().forEach(track => track.stop());
            } catch (pErr) {
                throw new Error('NOT_ALLOWED');
            }

            if (!mountedRef.current) return;

            // 2. Inicialización
            html5QrCodeRef.current = new Html5Qrcode("qr-reader");
            
            const qrBoxSize = window.innerWidth < 640 ? 200 : 250;
            const config = {
                fps: 15,
                qrbox: { width: qrBoxSize, height: qrBoxSize },
                aspectRatio: 1.0,
                videoConstraints: {
                    facingMode: mode,
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                }
            };

            await html5QrCodeRef.current.start(
                { facingMode: mode },
                config,
                (decodedText) => {
                    if (mountedRef.current && scannerStateRef.current === 'SCANNING') {
                        stopScanner(decodedText);
                    }
                },
                () => {}
            );

            if (mountedRef.current) {
                scannerStateRef.current = 'SCANNING';
                setIsScanning(true);
            } else {
                await stopScanner();
            }

        } catch (err) {
            console.error('Scan Start Error:', err);
            scannerStateRef.current = 'IDLE';
            let msg = 'Error al acceder a la cámara.';
            if (err.message === 'NOT_ALLOWED') msg = 'Permiso denegado.';
            if (mountedRef.current) setError(msg);
        }
    };

    const toggleCamera = async () => {
        if (scannerStateRef.current !== 'SCANNING') return;
        const newMode = facingMode === 'environment' ? 'user' : 'environment';
        setFacingMode(newMode);
        await stopScanner();
        setTimeout(() => {
            if (mountedRef.current) startScanner(newMode);
        }, 600);
    };

    useEffect(() => {
        mountedRef.current = true;
        const timer = setTimeout(() => {
            if (mountedRef.current) startScanner();
        }, 200);

        return () => {
            mountedRef.current = false;
            clearTimeout(timer);
            if (html5QrCodeRef.current) {
                const scanner = html5QrCodeRef.current;
                const state = scanner.getState();
                if (state === 2 || state === 3) {
                    scanner.stop().then(() => {
                        if (document.getElementById("qr-reader")) scanner.clear();
                    }).catch(() => {});
                }
            }
        };
    }, []);

    const handleClose = async () => {
        if (isStopping) return;
        await stopScanner();
        if (mountedRef.current) onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/95 z-[70] flex items-center justify-center sm:p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-none sm:rounded-2xl shadow-2xl w-full h-full sm:h-auto sm:max-w-md overflow-hidden flex flex-col">
                <div className="flex items-center justify-between px-4 py-4 sm:p-6 border-b bg-white">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-50 rounded-lg">
                            <Camera className="w-5 h-5 text-blue-600" />
                        </div>
                        <h2 className="text-lg sm:text-xl font-bold text-gray-800">Escanear QR</h2>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={toggleCamera}
                            className={`p-2 hover:bg-gray-100 rounded-lg transition-all border border-gray-100 ${isScanning ? 'opacity-100' : 'opacity-50 cursor-not-allowed'}`}
                            disabled={!isScanning || isStopping}
                        >
                            <RefreshCw className={`w-5 h-5 text-blue-600 ${isStopping ? 'animate-spin' : ''}`} />
                        </button>
                        <button onClick={handleClose} className="p-2 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors text-gray-500">
                            <X className="w-6 h-6" />
                        </button>
                    </div>
                </div>

                <div className="flex-1 flex flex-col p-4 sm:p-6 justify-center bg-gray-50/30">
                    {error ? (
                        <div className="space-y-4 animate-in slide-in-from-bottom-2 duration-300">
                            <div className="bg-red-50 border-2 border-red-200 text-red-700 px-5 py-5 rounded-2xl">
                                <div className="flex items-start gap-4">
                                    <AlertCircle className="w-6 h-6 mt-0.5 flex-shrink-0" />
                                    <div>
                                        <p className="font-bold mb-1">Error de cámara</p>
                                        <p className="text-sm opacity-90">{error}</p>
                                    </div>
                                </div>
                            </div>
                            <button onClick={() => startScanner()} className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-2xl font-bold shadow-lg transition-all">
                                Reintentar conexión
                            </button>
                        </div>
                    ) : (
                        <div className="relative group mx-auto w-full max-w-[320px]">
                            {/* ESCÁNER: Este div DEBE estar siempre vacío para que React no lo rastree */}
                            <div
                                id="qr-reader"
                                className="rounded-3xl overflow-hidden bg-black aspect-square w-full shadow-2xl border-[6px] border-white relative ring-4 ring-blue-50 z-0"
                            ></div>

                            {/* UI DE REACT: Separada totalmente del div de arriba */}
                            {!isScanning && (
                                <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900/80 backdrop-blur-sm rounded-3xl z-10">
                                    <RefreshCw className="w-10 h-10 text-blue-400 animate-spin mb-4" />
                                    <span className="text-white font-medium text-sm">Configurando cámara...</span>
                                </div>
                            )}

                            {isScanning && (
                                <div className="mt-8 text-center animate-in fade-in zoom-in duration-500">
                                    <div className="inline-flex items-center gap-3 bg-white shadow-sm text-blue-700 px-5 py-2.5 rounded-full text-sm font-bold border border-blue-100">
                                        <div className="w-2 h-2 bg-green-500 rounded-full animate-ping" />
                                        <span>Sistema Activo ({facingMode === 'environment' ? 'Trasera' : 'Frontal'})</span>
                                    </div>
                                    <p className="text-gray-400 text-xs mt-4 uppercase tracking-[0.2em] font-black">
                                        Encuadra el código QR
                                    </p>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <div className="p-4 sm:p-6 border-t bg-white">
                    <button onClick={handleClose} className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 py-4 rounded-2xl font-bold transition-all text-sm tracking-wide">
                        CANCELAR OPERACIÓN
                    </button>
                </div>
            </div>
        </div>
    );
};