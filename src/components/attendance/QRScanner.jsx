import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Camera, X, CheckCircle } from 'lucide-react';

export const QRScanner = ({ onScanSuccess, onClose }) => {
    const [error, setError] = useState('');
    const [isStopping, setIsStopping] = useState(false);
    const html5QrCodeRef = useRef(null);

    const startScanner = async () => {
        try {
            setError('');

            const element = document.getElementById("qr-reader");
            if (!element) return;

            html5QrCodeRef.current = new Html5Qrcode("qr-reader");

            // Determinar tamaño óptimo del cuadro de escaneo (responsive)
            const width = window.innerWidth;
            const qrBoxSize = width < 640 ? 200 : 250;

            await html5QrCodeRef.current.start(
                { facingMode: "environment" },
                {
                    fps: 10,
                    qrbox: { width: qrBoxSize, height: qrBoxSize },
                    aspectRatio: 1.0
                },
                (decodedText) => {
                    stopScanner(decodedText);
                },
                (errorMessage) => {
                    // Ignorar errores constantes de búsqueda
                }
            );
        } catch (err) {
            console.error('Error starting scanner:', err);
            setError('No se pudo acceder a la cámara. Por favor, asegúrate de dar los permisos necesarios y usar HTTPS.');
        }
    };

    const stopScanner = async (result = null) => {
        if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
            setIsStopping(true);
            try {
                await html5QrCodeRef.current.stop();
                html5QrCodeRef.current.clear();
                if (result) {
                    onScanSuccess(result);
                }
            } catch (err) {
                console.error('Error stopping scanner:', err);
            } finally {
                setIsStopping(false);
            }
        }
    };

    useEffect(() => {
        startScanner();

        return () => {
            if (html5QrCodeRef.current) {
                stopScanner();
            }
        };
    }, []);

    const handleClose = async () => {
        await stopScanner();
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/95 z-[70] flex items-center justify-center sm:p-4">
            <div className="bg-white rounded-none sm:rounded-2xl shadow-2xl w-full h-full sm:h-auto sm:max-w-md overflow-hidden flex flex-col">
                {/* Header - Más compacto en móvil */}
                <div className="flex items-center justify-between px-4 py-4 sm:p-6 border-b bg-white">
                    <div className="flex items-center gap-3">
                        <Camera className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
                        <h2 className="text-lg sm:text-xl font-bold">Escanear QR</h2>
                    </div>
                    <button
                        onClick={handleClose}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <X className="w-6 h-6 text-gray-500" />
                    </button>
                </div>

                {/* Scanner Body - Expandible */}
                <div className="flex-1 flex flex-col p-4 sm:p-6 justify-center">
                    {error && (
                        <div className="bg-red-50 border-2 border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm text-center">
                            {error}
                        </div>
                    )}

                    <div
                        id="qr-reader"
                        className="rounded-xl overflow-hidden bg-black aspect-square w-full mx-auto max-w-[320px] shadow-lg border-4 border-blue-100"
                    ></div>

                    <div className="mt-6 text-center">
                        <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 px-4 py-2 rounded-full text-xs sm:text-sm font-medium border border-blue-100">
                            <CheckCircle className="w-4 h-4 animate-pulse" />
                            <span>Buscando automáticamente...</span>
                        </div>
                        <p className="text-gray-500 text-[10px] sm:text-xs mt-2 uppercase tracking-widest font-bold">
                            Apunta al código QR del carnet
                        </p>
                    </div>
                </div>

                {/* Footer - Fijo abajo en móvil */}
                <div className="p-4 sm:p-6 border-t bg-gray-50">
                    <button
                        onClick={handleClose}
                        disabled={isStopping}
                        className="w-full bg-white hover:bg-gray-100 text-gray-700 py-3 rounded-xl font-bold border border-gray-200 transition-all disabled:opacity-50 text-sm"
                    >
                        CANCELAR
                    </button>
                </div>
            </div>
        </div>
    );
};
