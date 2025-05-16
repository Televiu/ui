import { h } from "preact";
import { useEffect, useState } from "preact/hooks";
import {
  channelSignal,
  loadChannelsFromFile,
  loadChannelsFromLocalStorage,
} from "../utils/channelStore.ts";

const sleep = (ms: number) => new Promise((res) => setTimeout(res, ms));

export default function Index() {
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);

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
          <h2 class="text-lg font-semibold text-center mb-4">
            Screen mode
          </h2>

          <div class="flex items-center justify-center mb-4">
            <p class="text-sm text-gray-400">
              Screen mode allows to send a m3u file to the play on the screen
              page, from a controller.
            </p>
          </div>

          <div class="text-sm text-gray-300 space-y-1 text-center mb-6">
            <p>1. Access screen page</p>
            <p>2. Open your phone camera</p>
            <p>3. Scan the QR code</p>
            <p>4. Upload your .m3u file</p>
          </div>

          <button
            onClick={() => window.location.href = "/screen"}
            class="mt-4 py-2 px-6 bg-blue-600 text-white rounded-full hover:bg-blue-700 focus:outline-none"
          >
            Go to Screen
          </button>

          <div class="w-full flex items-center my-4">
            <div class="flex-grow border-t border-gray-500" />
            <span class="px-4 text-sm text-gray-400">or</span>
            <div class="flex-grow border-t border-gray-500" />
          </div>

          <h2 class="text-lg font-semibold text-center mb-4">
            Playlist mode
          </h2>

          <div class="flex items-center justify-center mb-4">
            <p class="text-sm text-gray-400">
              Playlist mode allows you to upload m3u file with items to be
              played locally. It doesn't upload the playlist to the server, or
              save it in any way. All data is stored in your browser.
            </p>
          </div>

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
        </div>
      </div>

      <div class="absolute bottom-6 text-center w-full text-lg text-gray-400">
        <p>
          Need help? Visit{" "}
          <a
            href="https://github.com/televiu/web"
            class="text-blue-400 underline"
          >
            https://github.com/televiu/web
          </a>
        </p>
      </div>
    </div>
  );
}
