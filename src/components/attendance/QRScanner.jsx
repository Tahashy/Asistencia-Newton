import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Camera, X, CheckCircle, AlertCircle } from 'lucide-react';

export const QRScanner = ({ onScanSuccess, onClose }) => {
    const [error, setError] = useState('');
    const [isStopping, setIsStopping] = useState(false);
    const [isScanning, setIsScanning] = useState(false);
    const html5QrCodeRef = useRef(null);
    const mountedRef = useRef(true);

    const startScanner = async () => {
        try {
            setError('');
            
            // Verificar si ya existe una instancia
            if (html5QrCodeRef.current) {
                console.log('Ya existe una instancia del escáner');
                return;
            }

            const element = document.getElementById("qr-reader");
            if (!element) {
                setError('No se pudo inicializar el lector QR');
                return;
            }

            // Solicitar permisos de cámara primero
            try {
                await navigator.mediaDevices.getUserMedia({ video: true });
            } catch (permError) {
                console.error('Error de permisos:', permError);
                setError('Se requieren permisos de cámara. Por favor, permite el acceso a la cámara en tu navegador.');
                return;
            }

            // Crear instancia del escáner
            html5QrCodeRef.current = new Html5Qrcode("qr-reader");
            
            // Determinar tamaño óptimo del cuadro de escaneo (responsive)
            const width = window.innerWidth;
            const qrBoxSize = width < 640 ? 200 : 250;

            // Configuración mejorada para la cámara
            const config = {
                fps: 10,
                qrbox: { width: qrBoxSize, height: qrBoxSize },
                aspectRatio: 1.0,
                disableFlip: false,
                videoConstraints: {
                    facingMode: { ideal: "environment" },
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                }
            };

            await html5QrCodeRef.current.start(
                { facingMode: "environment" },
                config,
                (decodedText, decodedResult) => {
                    console.log('QR detectado:', decodedText);
                    if (mountedRef.current && !isStopping) {
                        stopScanner(decodedText);
                    }
                },
                (errorMessage) => {
                    // Ignorar errores de búsqueda constantes
                    // Solo loguear en consola para debugging
                    // console.log('Buscando QR...', errorMessage);
                }
            );

            setIsScanning(true);
            console.log('Escáner iniciado correctamente');

        } catch (err) {
            console.error('Error al iniciar el escáner:', err);
            
            let errorMsg = 'No se pudo acceder a la cámara.';
            
            if (err.name === 'NotAllowedError') {
                errorMsg = 'Permiso de cámara denegado. Por favor, permite el acceso a la cámara en la configuración de tu navegador.';
            } else if (err.name === 'NotFoundError') {
                errorMsg = 'No se encontró ninguna cámara en tu dispositivo.';
            } else if (err.name === 'NotReadableError') {
                errorMsg = 'La cámara está siendo utilizada por otra aplicación. Por favor, cierra otras aplicaciones que puedan estar usando la cámara.';
            } else if (err.name === 'OverconstrainedError') {
                errorMsg = 'No se pudo iniciar la cámara con la configuración solicitada.';
            } else if (err.name === 'SecurityError') {
                errorMsg = 'Error de seguridad. Asegúrate de estar usando HTTPS o localhost.';
            }
            
            setError(errorMsg);
        }
    };

    const stopScanner = async (result = null) => {
        if (!html5QrCodeRef.current) return;
        
        setIsStopping(true);
        
        try {
            const state = html5QrCodeRef.current.getState();
            
            if (state === Html5Qrcode.STATE_SCANNING) {
                await html5QrCodeRef.current.stop();
            }
            
            html5QrCodeRef.current.clear();
            html5QrCodeRef.current = null;
            
            setIsScanning(false);
            
            if (result && mountedRef.current) {
                onScanSuccess(result);
            }
        } catch (err) {
            console.error('Error al detener el escáner:', err);
        } finally {
            setIsStopping(false);
        }
    };

    useEffect(() => {
        mountedRef.current = true;
        
        // Pequeño delay para asegurar que el DOM esté listo
        const timer = setTimeout(() => {
            if (mountedRef.current) {
                startScanner();
            }
        }, 100);

        return () => {
            mountedRef.current = false;
            clearTimeout(timer);
            
            if (html5QrCodeRef.current) {
                stopScanner();
            }
        };
    }, []);

    const handleClose = async () => {
        await stopScanner();
        if (mountedRef.current) {
            onClose();
        }
    };

    const handleRetry = () => {
        setError('');
        startScanner();
    };

    return (
        <div className="fixed inset-0 bg-black/95 z-[70] flex items-center justify-center sm:p-4">
            <div className="bg-white rounded-none sm:rounded-2xl shadow-2xl w-full h-full sm:h-auto sm:max-w-md overflow-hidden flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-4 sm:p-6 border-b bg-white">
                    <div className="flex items-center gap-3">
                        <Camera className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
                        <h2 className="text-lg sm:text-xl font-bold">Escanear QR</h2>
                    </div>
                    <button
                        onClick={handleClose}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        disabled={isStopping}
                    >
                        <X className="w-6 h-6 text-gray-500" />
                    </button>
                </div>

                {/* Scanner Body */}
                <div className="flex-1 flex flex-col p-4 sm:p-6 justify-center">
                    {error ? (
                        <div className="space-y-4">
                            <div className="bg-red-50 border-2 border-red-200 text-red-700 px-4 py-4 rounded-lg text-sm">
                                <div className="flex items-start gap-3">
                                    <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
                                    <div>
                                        <p className="font-semibold mb-1">Error de cámara</p>
                                        <p>{error}</p>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-lg text-xs">
                                <p className="font-semibold mb-2">💡 Consejos para solucionar:</p>
                                <ul className="list-disc list-inside space-y-1">
                                    <li>Asegúrate de permitir el acceso a la cámara cuando el navegador lo solicite</li>
                                    <li>Verifica que ninguna otra aplicación esté usando la cámara</li>
                                    <li>Si estás en un iPhone/iPad, usa Safari (otros navegadores pueden tener restricciones)</li>
                                    <li>Intenta recargar la página</li>
                                </ul>
                            </div>

                            <button
                                onClick={handleRetry}
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-bold transition-all"
                            >
                                Reintentar
                            </button>
                        </div>
                    ) : (
                        <>
                            <div
                                id="qr-reader"
                                className="rounded-xl overflow-hidden bg-black aspect-square w-full mx-auto max-w-[320px] shadow-lg border-4 border-blue-100"
                            ></div>

                            <div className="mt-6 text-center">
                                {isScanning ? (
                                    <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 px-4 py-2 rounded-full text-xs sm:text-sm font-medium border border-blue-100">
                                        <CheckCircle className="w-4 h-4 animate-pulse" />
                                        <span>Buscando código QR...</span>
                                    </div>
                                ) : (
                                    <div className="inline-flex items-center gap-2 bg-gray-100 text-gray-600 px-4 py-2 rounded-full text-xs sm:text-sm font-medium">
                                        <span>Iniciando cámara...</span>
                                    </div>
                                )}
                                <p className="text-gray-500 text-[10px] sm:text-xs mt-2 uppercase tracking-widest font-bold">
                                    Apunta al código QR del carnet
                                </p>
                            </div>
                        </>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 sm:p-6 border-t bg-gray-50">
                    <button
                        onClick={handleClose}
                        disabled={isStopping}
                        className="w-full bg-white hover:bg-gray-100 text-gray-700 py-3 rounded-xl font-bold border border-gray-200 transition-all disabled:opacity-50 text-sm"
                    >
                        {isStopping ? 'Cerrando...' : 'CANCELAR'}
                    </button>
                </div>
            </div>
        </div>
    );
};