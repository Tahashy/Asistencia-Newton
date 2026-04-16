import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Camera, X, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';

export const QRScanner = ({ onScanSuccess, onClose }) => {
    const [error, setError] = useState('');
    const [isStopping, setIsStopping] = useState(false);
    const [isScanning, setIsScanning] = useState(false);
    const [facingMode, setFacingMode] = useState('environment'); // 'environment' o 'user'
    const html5QrCodeRef = useRef(null);
    const mountedRef = useRef(true);

    const startScanner = async (mode = facingMode) => {
        try {
            setError('');
            setIsScanning(false);
            
            // Verificar si ya existe una instancia
            if (html5QrCodeRef.current) {
                const state = html5QrCodeRef.current.getState();
                if (state === Html5Qrcode.STATE_SCANNING) {
                    await html5QrCodeRef.current.stop();
                }
                html5QrCodeRef.current.clear();
                html5QrCodeRef.current = null;
            }

            const element = document.getElementById("qr-reader");
            if (!element) {
                setError('No se pudo inicializar el lector QR');
                return;
            }

            // Solicitar permisos de cámara y LIBERAR inmediatamente
            // Esto es crucial en móviles para evitar el error "Cámara en uso"
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ video: true });
                stream.getTracks().forEach(track => track.stop()); // Detener inmediatamente el stream de permiso
            } catch (permError) {
                console.error('Error de permisos:', permError);
                setError('Se requieren permisos de cámara. Por favor, permite el acceso a la cámara en tu navegador.');
                return;
            }

            // Crear instancia del escáner
            html5QrCodeRef.current = new Html5Qrcode("qr-reader");
            
            const width = window.innerWidth;
            const qrBoxSize = width < 640 ? 200 : 250;

            const config = {
                fps: 15, // Aumentar un poco los FPS para mejor detección en móviles
                qrbox: { width: qrBoxSize, height: qrBoxSize },
                aspectRatio: 1.0,
                disableFlip: mode === 'user' ? false : true,
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
                    console.log('QR detectado:', decodedText);
                    if (mountedRef.current && !isStopping) {
                        stopScanner(decodedText);
                    }
                },
                (errorMessage) => {
                    // Ignorar errores de escaneo constante
                }
            );

            if (mountedRef.current) {
                setIsScanning(true);
            }

        } catch (err) {
            console.error('Error al iniciar el escáner:', err);
            let errorMsg = 'No se pudo acceder a la cámara.';
            
            if (err.name === 'NotAllowedError') {
                errorMsg = 'Permiso denegado. Activa la cámara en la configuración.';
            } else if (err.name === 'NotFoundError') {
                errorMsg = 'No se encontró cámara disponible.';
            } else if (err.name === 'NotReadableError') {
                errorMsg = 'La cámara está bloqueada por otra aplicación o pestaña abierta.';
            } else if (err.includes && err.includes('Stream startup timeout')) {
                errorMsg = 'Tiempo de espera agotado. Intenta recargar la página.';
            }
            
            if (mountedRef.current) setError(errorMsg);
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
            
            if (mountedRef.current) setIsScanning(false);
            
            if (result && mountedRef.current) {
                onScanSuccess(result);
            }
        } catch (err) {
            console.error('Error al detener el escáner:', err);
        } finally {
            if (mountedRef.current) setIsStopping(false);
        }
    };

    const toggleCamera = async () => {
        const newMode = facingMode === 'environment' ? 'user' : 'environment';
        setFacingMode(newMode);
        await stopScanner();
        setTimeout(() => {
            if (mountedRef.current) startScanner(newMode);
        }, 300);
    };

    useEffect(() => {
        mountedRef.current = true;
        const timer = setTimeout(() => {
            if (mountedRef.current) startScanner();
        }, 100);

        return () => {
            mountedRef.current = false;
            clearTimeout(timer);
            if (html5QrCodeRef.current) stopScanner();
        };
    }, []);

    const handleClose = async () => {
        await stopScanner();
        if (mountedRef.current) onClose();
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
                    <div className="flex items-center gap-2">
                        <button
                            onClick={toggleCamera}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors border border-gray-100"
                            title="Cambiar cámara"
                            disabled={isStopping}
                        >
                            <RefreshCw className="w-5 h-5 text-blue-600" />
                        </button>
                        <button
                            onClick={handleClose}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            disabled={isStopping}
                        >
                            <X className="w-6 h-6 text-gray-500" />
                        </button>
                    </div>
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
                                    <li>Cierra otras pestañas o aplicaciones que estén usando la cámara.</li>
                                    <li>Asegúrate de haber aceptado el permiso de cámara.</li>
                                    <li>Prueba cambiando de cámara con el botón de arriba 🔄.</li>
                                    <li>Recarga la aplicación.</li>
                                </ul>
                            </div>

                            <button
                                onClick={() => startScanner()}
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-bold transition-all"
                            >
                                Reintentar
                            </button>
                        </div>
                    ) : (
                        <>
                            <div
                                id="qr-reader"
                                className="rounded-xl overflow-hidden bg-black aspect-square w-full mx-auto max-w-[320px] shadow-lg border-4 border-blue-100 relative"
                            >
                                {/* Overlay informativo */}
                                {!isScanning && !error && (
                                    <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                                        <RefreshCw className="w-8 h-8 text-white animate-spin" />
                                    </div>
                                )}
                            </div>

                            <div className="mt-6 text-center">
                                {isScanning ? (
                                    <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 px-4 py-2 rounded-full text-xs sm:text-sm font-medium border border-blue-100">
                                        <CheckCircle className="w-4 h-4 animate-pulse" />
                                        <span>Buscando código QR ({facingMode === 'environment' ? 'Trasera' : 'Frontal'})...</span>
                                    </div>
                                ) : (
                                    <div className="inline-flex items-center gap-2 bg-gray-100 text-gray-600 px-4 py-2 rounded-full text-xs sm:text-sm font-medium">
                                        <span>Conectando cámara...</span>
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