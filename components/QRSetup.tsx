import { h } from "preact";

interface QRSetupProps {
  qrLoading: boolean;
  registered: boolean;
  deviceInfo: { device: string; secret: string } | null;
  status: string;
  qrImage: string | null;
}

export default function QRSetup(
  { qrLoading, registered, deviceInfo, status, qrImage }: QRSetupProps,
) {
  return (
    <div className="flex flex-col lg:flex-row items-center justify-center gap-24 mb-10 w-full max-w-6xl px-4">
      <div className="w-full max-w-md flex justify-center">
        <img src="/logo.png" alt="TV Illustration" className="w-full h-auto" />
      </div>

      <div className="flex flex-col items-center justify-center text-center">
        <p className="text-lg font-medium mb-4 text-center">
          {qrLoading
            ? "Generating QR code..."
            : registered && deviceInfo
            ? "Scan to upload your media"
            : "Waiting for device registration..."}
        </p>

        <div
          className="w-64 h-64 mb-4 flex items-center justify-center bg-black"
          id="qr-container"
          dangerouslySetInnerHTML={{ __html: qrImage! }}
        >
          {qrLoading && (
            <div className="w-16 h-16 border-4 border-white border-t-transparent rounded-full animate-spin" />
          )}
          {!qrLoading && !registered && (
            <div className="text-center text-gray-400">
              QR code will appear after device registration
            </div>
          )}
        </div>

        {registered && deviceInfo && (
          <div className="text-sm text-gray-300 space-y-1 text-center mb-6">
            <p>1. Open your phone camera</p>
            <p>2. Scan the QR code</p>
            <p>3. Upload your .m3u file</p>
            <p className="mt-4 text-xs text-gray-400">
              Device ID: {deviceInfo.device}
            </p>
          </div>
        )}

        <div className="flex flex-col items-center justify-center mb-4">
          {status === "Initializing..." && (
            <>
              <p className="text-lg text-gray-300">Initializing...</p>
              <p className="text-sm text-gray-500 mt-2">
                Setting up your viewing experience
              </p>
            </>
          )}
          {status === "Registering device..." && (
            <>
              <p className="text-lg text-gray-300">Registering device...</p>
              <p className="text-sm text-gray-500 mt-2">
                Please wait while we set up your device
              </p>
            </>
          )}
          {status === "Registration complete" && (
            <>
              <p className="text-lg text-gray-300">Device registered</p>
              <p className="text-sm text-gray-500 mt-2">
                Connecting to streaming server...
              </p>
            </>
          )}
          {status === "Connecting to WebSocket..." && (
            <>
              <p className="text-lg text-gray-300">Connecting to server...</p>
              <p className="text-sm text-gray-500 mt-2">
                Please wait while we establish connection
              </p>
            </>
          )}
          {status === "Connected" && (
            <>
              <p className="text-lg text-gray-300">
                Ready to pair with a remote device
              </p>
              <p className="text-sm text-gray-500 mt-2">
                Use the mobile app to connect to this screen
              </p>
            </>
          )}
          {status === "Paired" && (
            <>
              <p className="text-lg text-gray-300">
                Device paired successfully
              </p>
              <p className="text-sm text-gray-500 mt-2">
                Select content from your device to begin playback
              </p>
            </>
          )}
          {status === "Stopped" && (
            <>
              <p className="text-lg text-gray-300">Playback stopped</p>
              <p className="text-sm text-gray-500 mt-2">
                Select new content from your device
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
