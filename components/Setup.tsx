import { useEffect, useState } from "preact/hooks";
import { qrcode } from "@libs/qrcode";

interface SetupProps {
    error: string | undefined
    status: string | null
    deviceInfo: { device: string; secret: string } | null
}

export default function Setup({ error, status, deviceInfo }: SetupProps) {
    const [qrImage, setQrImage] = useState<string | null>(null);
    const [qrLoading, setQrLoading] = useState(false);

    const generateQR = async (deviceId: string, secret: string) => {
        setQrLoading(true);

        try {
            // this returns an SVG string
            const rawSvg = qrcode(
                `https://televiu.fly.dev/controller?device=${deviceId}&secret=${secret}`,
                { output: "svg", ecl: "HIGH" }
            );
            const svgUri =
                "data:image/svg+xml;utf8," + encodeURIComponent(rawSvg);
            setQrImage(svgUri);
        } catch (err) {
            console.error("QR generation failed", err);
        } finally {
            setQrLoading(false);
        }
    };

    useEffect(() => {
        console.trace("device info updated");

        if (deviceInfo?.device && deviceInfo?.secret == "") {
            generateQR(deviceInfo.device, deviceInfo.secret);
        }
    }, [deviceInfo]);

    return (
        <div className="flex lg:flex-row items-center justify-center gap-24 mb-10 w-full max-w-6xl px-4">
            <div className="w-full max-w-md flex justify-center">
                <img src="/logo.png" alt="Televiu's logo" className="w-full h-auto" />
            </div>

            <div className="flex flex-col items-center text-center">
                <p className="text-lg font-medium mb-4">
                    {qrLoading
                        ? "Generating QR code..."
                        : error
                            ? error
                            : deviceInfo
                                ? "Scan to upload your media"
                                : "Waiting for device registration..."}
                </p>

                <div className="w-64 h-64 mb-4 flex items-center justify-center bg-black">
                    {qrLoading && (
                        <div className="w-16 h-16 border-4 border-white border-t-transparent rounded-full animate-spin" />
                    )}

                    {(!qrLoading && qrImage) && (
                        <img
                            src={qrImage}
                            alt="QR code"
                            className="w-full h-full object-contain"
                        />
                    )}

                    {!qrLoading && !qrImage && !error && (
                        <div className="text-gray-400">
                            QR code will appear after device registration
                        </div>
                    )}

                    {!qrLoading && !qrImage && error && (
                        <div className="text-gray-400">
                            Failed to connect to server
                        </div>
                    )}
                </div>

                {error && <p className="text-red-500 mb-4">{error}</p>}

                {deviceInfo && (
                    <div className="text-sm text-gray-300 space-y-1 mb-6">
                        <p>1. Open your phone camera</p>
                        <p>2. Scan the QR code</p>
                        <p>3. Upload your .m3u file</p>
                        <p className="m-4 text-xs text-gray-400">
                            Device ID: {deviceInfo.device}
                        </p>
                    </div>
                )}

                <p className="text-lg text-gray-300">{status}</p>
            </div>
        </div>
    );
}
