import { h } from "preact";
import { useEffect, useState } from "preact/hooks";
import { qrcode } from "@libs/qrcode";
import {
  channelSignal,
  loadChannelsFromFile,
  loadChannelsFromLocalStorage,
} from "../utils/channelStore.ts";

const sleep = (ms: number) => new Promise((res) => setTimeout(res, ms));

export default function Setup(props) {
  const [qrImage, setQrImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);

  const uploadMode = props.mode;
  const showQR = uploadMode === "qr" || uploadMode === "both" || !uploadMode;
  const showLocal = uploadMode === "local" || uploadMode === "both" || !uploadMode;

  // Check localStorage for existing playlist
  useEffect(() => {
    loadChannelsFromLocalStorage();

    requestAnimationFrame(() => {
      if (channelSignal.value.length > 0) {
        window.location.href = "/channels";
      } else {
        setLoading(false);
      }
    });
  }, []);

  useEffect(() => {
    const generateQR = async () => {
      if (!showQR) return;
      await sleep(1000);
      try {
        const svg = await qrcode("https://example.com", {
          output: "svg",
          ecl: "HIGH",
        });
        setQrImage(svg);
      } catch (err) {
        console.error("QR generation failed", err);
        setError("QR code unavailable. Please try again later.");
      }
    };

    generateQR();
  }, [showQR]);

  const isQRLoading = !qrImage && !error;

  if (loading) {
    return (
      <div class="min-h-screen flex items-center justify-center bg-[#08192D] text-white">
        <div class="flex flex-col items-center space-y-4">
          <div class="h-16 w-16 border-4 border-white border-t-transparent rounded-full animate-spin" />
          <p class="text-lg">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div
      class="relative min-h-screen flex flex-col items-center justify-center text-white px-6 py-12"
      style="background-color: #08192D"
    >
      <div class="flex flex-col lg:flex-row items-center justify-center gap-24 mb-10 w-full max-w-6xl">

        <div class="w-full max-w-md flex justify-center">
          <img src="/logo.png" alt="TV Illustration" class="w-full h-auto" />
        </div>

        <div class="relative flex flex-col items-center w-full max-w-md bg-[#1A4576] p-6 rounded-2xl shadow-xl">
          {uploading && (
            <div class="absolute inset-0 bg-[#1A4576]/90 flex flex-col items-center justify-center z-20">
              <div class="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin mb-4" />
              <p class="text-white text-lg">Processing playlist...</p>
            </div>
          )}

          {showQR && (
            <>
              <p class="text-lg font-medium mb-4 text-center">
                {isQRLoading
                  ? "Generating QR code..."
                  : error
                  ? "Error"
                  : "Scan to upload your playlist"}
              </p>

              <div class="w-64 h-64 mb-4 flex items-center justify-center">
                {isQRLoading ? (
                  <div class="w-16 h-16 border-4 border-white border-t-transparent rounded-full animate-spin" />
                ) : error ? (
                  <div class="text-red-400 text-center">{error}</div>
                ) : (
                  <div
                    class="w-full h-full"
                    dangerouslySetInnerHTML={{ __html: qrImage! }}
                  />
                )}
              </div>

              <div class="text-sm text-gray-300 space-y-1 text-center mb-6">
                <p>1. Open your phone camera</p>
                <p>2. Scan the QR code</p>
                <p>3. Upload your .m3u file</p>
              </div>
            </>
          )}

          {showQR && showLocal && (
            <div class="w-full flex items-center my-4">
              <div class="flex-grow border-t border-gray-500" />
              <span class="px-4 text-sm text-gray-400">or</span>
              <div class="flex-grow border-t border-gray-500" />
            </div>
          )}

          {showLocal && (
            <div class="flex flex-col items-center w-full">
              <input
                type="file"
                accept=".m3u,.m3u8"
                class="file:bg-blue-600 file:text-white file:px-4 file:py-2 file:rounded-full file:border-none file:cursor-pointer text-sm text-gray-300 mb-4"
                onChange={async (e) => {
                  const file = e.currentTarget.files?.[0];
                  if (file) {
                    setUploading(true);
                    try {
                      await sleep(2000);
                      await loadChannelsFromFile(file);
                      if (channelSignal.value.length > 0) {
                        window.location.href = "/channels";
                      } else {
                        throw new Error("No valid channels found in playlist.");
                      }
                    } catch (err) {
                      console.error("Failed to load playlist from file:", err);
                      setError("Failed to load playlist from file.");
                      setUploading(false);
                    }
                  }
                }}
              />
              <p class="text-sm text-gray-400">Upload from your computer</p>
            </div>
          )}

          <p class="mt-6 text-lg font-semibold animate-pulse text-center">
            Waiting for playlist...
          </p>
        </div>
      </div>

      <div class="absolute bottom-6 text-center w-full text-lg text-gray-400">
        <p>
          Need help? Visit{" "}
          <a href="https://github.com/Televiu/ui" class="text-blue-400 underline">
            https://github.com/Televiu/ui
          </a>
        </p>
      </div>
    </div>
  );
}
