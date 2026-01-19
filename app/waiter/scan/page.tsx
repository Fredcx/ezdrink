"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, RefreshCw, AlertCircle, Camera, CheckCircle } from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import jsQR from "jsqr";

export default function WaiterScanPage() {
    const router = useRouter();
    const [manualCode, setManualCode] = useState("");
    const [headerText, setHeaderText] = useState("Iniciando Câmera...");
    const [permissionError, setPermissionError] = useState<string | null>(null);
    const [hasBarcodeDetector, setHasBarcodeDetector] = useState(true);
    const [scanCount, setScanCount] = useState(0);

    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animationFrameRef = useRef<number | null>(null);
    const activeScanRef = useRef(false);

    const handleScan = (code: string) => {
        if (!code) return;

        // Vibrate
        if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(200);

        // Extract ticket logic
        let ticketCode = code;
        try {
            if (code.includes('?ticket=')) ticketCode = code.split('?ticket=')[1];
            else if (code.includes('/')) ticketCode = code.split('/').pop() || code;
        } catch (e) { }

        stopCamera();
        router.push(`/waiter/order/${ticketCode}`);
    };

    const stopCamera = () => {
        activeScanRef.current = false;
        if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current);
            animationFrameRef.current = null;
        }
        if (videoRef.current && videoRef.current.srcObject) {
            const stream = videoRef.current.srcObject as MediaStream;
            stream.getTracks().forEach(track => track.stop());
            videoRef.current.srcObject = null;
        }
    };

    const detectQRCode = () => {
        if (!activeScanRef.current) return;

        const video = videoRef.current;
        const canvas = canvasRef.current;

        if (!video || !canvas) {
            animationFrameRef.current = requestAnimationFrame(detectQRCode);
            return;
        }

        if (video.readyState === video.HAVE_ENOUGH_DATA) {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;

            const context = canvas.getContext('2d');
            if (context) {
                context.drawImage(video, 0, 0, canvas.width, canvas.height);
                const imageData = context.getImageData(0, 0, canvas.width, canvas.height);

                const code = jsQR(imageData.data, imageData.width, imageData.height, {
                    inversionAttempts: "dontInvert",
                });

                if (code && code.data) {
                    console.log("✅ QR CODE DETECTADO:", code.data);
                    handleScan(code.data); // Stop and redirect
                    return;
                }
            }
            setScanCount(prev => prev + 1);
        }

        animationFrameRef.current = requestAnimationFrame(detectQRCode);
    };

    const openCamera = async () => {
        setPermissionError(null);
        activeScanRef.current = true;
        setHeaderText("Iniciando Câmera...");

        try {
            // Priority: User/Environment agnostic (let browser decide default) -> then low res fallback
            let stream;
            try {
                // Try facingMode user (PC default) or environment (Phone default) if specific requested
                // But generally { video: true } is safest for "just give me a camera"
                stream = await navigator.mediaDevices.getUserMedia({
                    video: { facingMode: "environment" }
                });
            } catch (err) {
                console.warn("Retrying with default video constraint...");
                stream = await navigator.mediaDevices.getUserMedia({ video: true });
            }

            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                // Important for iOS
                videoRef.current.setAttribute("playsinline", "true");

                await videoRef.current.play();
                setHeaderText("Escaneie o QR Code");
                animationFrameRef.current = requestAnimationFrame(detectQRCode);
            }
        } catch (error: any) {
            console.error("Camera error:", error);
            let msg = "Erro ao acessar câmera.";
            if (error.name === 'NotAllowedError') msg = "Permissão de câmera negada.";
            if (error.name === 'NotFoundError') msg = "Nenhuma câmera encontrada.";
            if (error.name === 'NotReadableError') msg = "Câmera em uso por outro app.";
            setPermissionError(msg);
            setHeaderText("Erro Câmera");
        }
    };

    useEffect(() => {
        // Start camera on mount
        openCamera();
        return () => stopCamera();
    }, []);

    return (
        <div className="fixed inset-0 bg-black text-white flex flex-col z-50 overflow-hidden">

            {/* Header */}
            <div className="absolute top-0 left-0 right-0 p-6 pt-12 flex justify-between items-center z-20">
                <Link href="/waiter" className="w-12 h-12 bg-black/40 backdrop-blur-md rounded-full flex items-center justify-center border border-white/10 active:scale-95 transition-all shadow-lg">
                    <ArrowLeft className="w-6 h-6 text-white" />
                </Link>
                <div className="text-sm font-bold opacity-70 bg-black/50 px-3 py-1 rounded-full">{headerText}</div>
            </div>

            {/* Camera Area */}
            <div className="absolute inset-0 bg-black flex items-center justify-center overflow-hidden">
                <video
                    ref={videoRef}
                    className="w-full h-full object-cover"
                    playsInline
                    muted
                />
                <canvas ref={canvasRef} className="hidden" />

                {permissionError && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/80 p-8 text-center z-30">
                        <div>
                            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                            <h3 className="text-xl font-bold mb-2">Ops!</h3>
                            <p className="text-gray-300 mb-6">{permissionError}</p>
                            <button onClick={() => window.location.reload()} className="bg-white text-black px-6 py-2 rounded-full font-bold">
                                Tentar Novamente
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Overlay */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                <div className="w-[280px] h-[280px] border-2 border-white/20 rounded-3xl relative">
                    <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-green-500 rounded-tl-2xl -mt-1 -ml-1"></div>
                    <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-green-500 rounded-tr-2xl -mt-1 -mr-1"></div>
                    <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-green-500 rounded-bl-2xl -mb-1 -ml-1"></div>
                    <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-green-500 rounded-br-2xl -mb-1 -mr-1"></div>
                </div>
            </div>

            {/* Manual Input Fallback */}
            <div className="absolute bottom-0 left-0 right-0 p-6 pb-12 bg-gradient-to-t from-black via-black/90 to-transparent z-20">
                <div className="flex gap-3">
                    <input
                        type="text"
                        placeholder="Ou digite o código ex: PAG-123"
                        className="flex-1 bg-white/10 border border-white/10 rounded-xl px-4 py-4 text-white placeholder-white/50 font-bold outline-none focus:bg-white/20 transition-all"
                        value={manualCode}
                        onChange={(e) => setManualCode(e.target.value)}
                    />
                    <button
                        onClick={() => handleScan(manualCode)}
                        disabled={!manualCode}
                        className="bg-green-500 text-black font-bold px-6 rounded-xl hover:bg-green-400 disabled:opacity-50 disabled:bg-gray-700 disabled:text-gray-500 transition-all"
                    >
                        <ArrowRight />
                    </button>
                </div>
            </div>
        </div>
    );
}
