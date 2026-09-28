'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Html5Qrcode, Html5QrcodeCameraScanConfig } from 'html5-qrcode';
import { Camera, X, RefreshCw, Upload, Sparkles, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface CameraQrScannerProps {
  isOpen: boolean;
  onClose: () => void;
  onScanSuccess: (decodedText: string) => void;
}

export default function CameraQrScanner({
  isOpen,
  onClose,
  onScanSuccess,
}: CameraQrScannerProps) {
  const [cameras, setCameras] = useState<Array<{ id: string; label: string }>>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string>('');
  const [isScanning, setIsScanning] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const [scanSuccessFeedback, setScanSuccessFeedback] = useState<string | null>(null);

  const qrRegionId = 'interactive-camera-qr-region';
  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Stop scanning helper
  const stopScanning = useCallback(async () => {
    if (html5QrCodeRef.current) {
      try {
        if (html5QrCodeRef.current.isScanning) {
          await html5QrCodeRef.current.stop();
        }
        html5QrCodeRef.current.clear();
      } catch (e) {
        console.error('Error stopping QR scanner:', e);
      } finally {
        html5QrCodeRef.current = null;
        setIsScanning(false);
      }
    }
  }, []);

  // Handle successful scan
  const handleSuccess = useCallback(
    async (decodedText: string) => {
      setScanSuccessFeedback(decodedText);
      await stopScanning();
      setTimeout(() => {
        onScanSuccess(decodedText);
        onClose();
        setScanSuccessFeedback(null);
      }, 700);
    },
    [onScanSuccess, onClose, stopScanning]
  );

  // Start live scanner with chosen camera or facing mode
  const startCameraScanning = useCallback(
    async (cameraId?: string) => {
      setErrorMsg('');
      setScanSuccessFeedback(null);

      // Verify browser camera support (WebRTC getUserMedia)
      if (typeof navigator === 'undefined' || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setErrorMsg(
          'Akses kamera langsung (getUserMedia) tidak didukung oleh browser pada koneksi HTTP non-aman. Silakan gunakan tombol "Unggah / Foto Gambar Tiket QR" di bawah.'
        );
        return;
      }

      try {
        await stopScanning();

        const html5QrCode = new Html5Qrcode(qrRegionId);
        html5QrCodeRef.current = html5QrCode;

        const config: Html5QrcodeCameraScanConfig = {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
        };

        const cameraConfig = cameraId
          ? { deviceId: { exact: cameraId } }
          : { facingMode: 'environment' };

        await html5QrCode.start(
          cameraConfig,
          config,
          (decodedText) => {
            handleSuccess(decodedText);
          },
          (_errorMessage) => {
            // Frame parse error (normal when QR not in view)
          }
        );

        setIsScanning(true);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        console.error('Camera start error:', err);
        if (message.includes('NotAllowedError') || message.includes('Permission')) {
          setErrorMsg('Izin akses kamera ditolak oleh browser. Mohon izinkan akses kamera di pengaturan browser.');
        } else if (message.includes('NotFoundError') || message.includes('no cameras')) {
          setErrorMsg('Tidak ada perangkat kamera / webcam yang terdeteksi di perangkat ini.');
        } else {
          setErrorMsg(
            'Gagal membuka kamera: ' +
              message +
              '. Gunakan opsi "Unggah / Foto Gambar Tiket QR" jika berada di jaringan lokal HTTP.'
          );
        }
        setIsScanning(false);
      }
    },
    [handleSuccess, stopScanning]
  );

  // Initial setup when modal opens
  useEffect(() => {
    if (!isOpen) {
      stopScanning();
      return;
    }

    let isMounted = true;

    async function init() {
      try {
        const devices = await Html5Qrcode.getCameras();
        if (isMounted && devices && devices.length > 0) {
          setCameras(devices);
          const backCam = devices.find((d) =>
            d.label.toLowerCase().includes('back') ||
            d.label.toLowerCase().includes('belakang') ||
            d.label.toLowerCase().includes('environment')
          );
          const initialId = backCam ? backCam.id : devices[0].id;
          setSelectedCameraId(initialId);
          startCameraScanning(initialId);
        } else if (isMounted) {
          // Try environment fallback anyway
          startCameraScanning();
        }
      } catch (_e) {
        // Fallback directly to environment mode
        if (isMounted) {
          startCameraScanning();
        }
      }
    }

    init();

    return () => {
      isMounted = false;
      stopScanning();
    };
  }, [isOpen, startCameraScanning, stopScanning]);

  // Handle image file scan fallback
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsProcessingFile(true);
    setErrorMsg('');

    try {
      const html5QrCode = new Html5Qrcode(qrRegionId);
      const decodedText = await html5QrCode.scanFile(file, true);
      html5QrCode.clear();
      handleSuccess(decodedText);
    } catch (_err) {
      setErrorMsg('Tidak dapat mendeteksi Kode QR pada foto/gambar yang diunggah. Pastikan gambar jelas dan fokus.');
    } finally {
      setIsProcessingFile(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[#034275] text-white">
              <Camera className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-base leading-tight">
                Pindai Tiket QR via Kamera
              </h3>
              <p className="text-xs text-slate-500">
                Arahkan kamera ke Kode QR pemohon atau unggah foto tiket
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              stopScanning();
              onClose();
            }}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 overflow-y-auto flex-1">
          {/* Success overlay state */}
          {scanSuccessFeedback && (
            <div className="bg-emerald-50 border border-emerald-300 rounded-xl p-4 text-center space-y-2 animate-in zoom-in-95">
              <CheckCircle2 className="h-10 w-10 text-emerald-600 mx-auto" />
              <div className="font-bold text-emerald-900 text-sm">Kode QR Berhasil Dipindai!</div>
              <p className="font-mono text-xs bg-white py-1 px-3 rounded-lg border border-emerald-200 text-emerald-800 break-all inline-block">
                {scanSuccessFeedback}
              </p>
            </div>
          )}

          {/* Camera Viewer Box */}
          <div className="relative rounded-2xl overflow-hidden bg-black aspect-square flex items-center justify-center border-2 border-slate-800 shadow-inner">
            <div id={qrRegionId} className="w-full h-full" />

            {!isScanning && !errorMsg && !scanSuccessFeedback && (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-white p-4 text-center space-y-2 bg-slate-900/80">
                <RefreshCw className="h-8 w-8 animate-spin text-blue-400" />
                <p className="text-xs">Memulai feed kamera...</p>
              </div>
            )}
          </div>

          {/* Error notice if camera fails */}
          {errorMsg && (
            <Alert variant="destructive">
              <AlertTitle>Perhatian Akses Kamera</AlertTitle>
              <AlertDescription className="text-xs leading-relaxed">
                {errorMsg}
              </AlertDescription>
            </Alert>
          )}

          {/* Camera controls */}
          {cameras.length > 1 && (
            <div className="flex items-center gap-2">
              <label className="text-xs font-semibold text-slate-700 shrink-0">
                Pilih Kamera:
              </label>
              <select
                value={selectedCameraId}
                onChange={(e) => {
                  const id = e.target.value;
                  setSelectedCameraId(id);
                  startCameraScanning(id);
                }}
                className="text-xs rounded-lg border border-slate-300 px-3 py-1.5 w-full bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#034275]"
              >
                {cameras.map((c, idx) => (
                  <option key={c.id} value={c.id}>
                    {c.label || `Kamera ${idx + 1}`}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Alternative: Upload / Capture image fallback */}
          <div className="border-t border-slate-100 pt-3">
            <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="text-left">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                  Opsi Alternatif Scan
                </span>
                <p className="text-[11px] text-slate-500">
                  Ambil foto langsung atau unggah gambar/screenshot QR tiket
                </p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleFileUpload}
                className="hidden"
                id="qr-file-upload-input"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={isProcessingFile}
                className="text-xs shrink-0 flex items-center gap-1.5 h-8 border-slate-300 hover:bg-white"
              >
                <Upload className="h-3.5 w-3.5 text-slate-600" />
                {isProcessingFile ? 'Menganalisis...' : 'Unggah / Foto Gambar'}
              </Button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-100 bg-slate-50 flex items-center justify-end">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              stopScanning();
              onClose();
            }}
            className="text-xs text-slate-600"
          >
            Tutup Scanner
          </Button>
        </div>
      </div>
    </div>
  );
}
