import { h } from "preact";
import { useEffect, useRef, useState } from "preact/hooks";
import { IS_BROWSER } from "$fresh/runtime.ts";

interface ControllerProps {
  server_address: string;
  ui_address: string;
  http_scheme: string;
  websocket_scheme: string;
}

export default function Controller(props: ControllerProps) {
  const [status, setStatus] = useState("Disconnected");
  const [error, setError] = useState("");
  const [deviceId, setDeviceId] = useState("");
  const [secret, setSecret] = useState("");
  const [connected, setConnected] = useState(false);
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [playUrl, setPlayUrl] = useState("");
  const [recentStreams, setRecentStreams] = useState<string[]>([]);
  const [paired, setPaired] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [showRecent, setShowRecent] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  const streamInputRef = useRef<HTMLInputElement>(null);
  const errorTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const deviceParam = urlParams.get("device");
    const secretParam = urlParams.get("secret");

    if (deviceParam) {
      setDeviceId(deviceParam);
    }

    if (secretParam) {
      setSecret(secretParam);
    }

    if (deviceParam && secretParam) {
      connectWebSocket(deviceParam, secretParam);
    }

    try {
      const savedStreams = localStorage.getItem("recentStreams");
      if (savedStreams) {
        setRecentStreams(JSON.parse(savedStreams));
      }
    } catch (e) {
      console.error("Failed to load recent streams:", e);
    }

    if (IS_BROWSER) {
      const meta = document.createElement("meta");
      meta.name = "viewport";
      meta.content =
        "width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no";
      document.getElementsByTagName("head")[0].appendChild(meta);
    }

    return () => {
      if (errorTimeoutRef.current) {
        clearTimeout(errorTimeoutRef.current);
      }
    };
  }, []);

  const showTemporaryToast = (message: string) => {
    setToastMessage(message);
    setShowToast(true);
    setTimeout(() => {
      setShowToast(false);
    }, 3000);
  };

  const displayTemporaryError = (message: string) => {
    setError(message);

    if (errorTimeoutRef.current) {
      clearTimeout(errorTimeoutRef.current);
    }

    errorTimeoutRef.current = setTimeout(() => {
      setError("");
      errorTimeoutRef.current = null;
    }, 5000) as unknown as number;
  };

  const connectWebSocket = (device: string, secret: string) => {
    if (!IS_BROWSER) return;

    try {
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.close();
      }

      setStatus("Connecting...");
      setError("");

      const socket = new WebSocket(
        `${props.websocket_scheme}://${props.server_address}/ws/controller?device=${device}&secret=${secret}`,
      );

      const connectionTimeout = setTimeout(() => {
        if (socket.readyState !== WebSocket.OPEN) {
          displayTemporaryError(
            "Connection timeout. Server might be down or under maintenance.",
          );
          socket.close();
        }
      }, 10000);

      socket.onopen = () => {
        clearTimeout(connectionTimeout);
        setConnected(true);
        setStatus("Connected");
        showTemporaryToast("Connected successfully");
      };

      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log("Received event:", data);

          if (data.status === "paired") {
            setPaired(true);
            setStatus("Paired");
            showTemporaryToast("Paired with device");
          } else if (data.status === "unpaired") {
            setPaired(false);
            setPlaying(false);
            setStatus("Unpaired");
            showTemporaryToast("Unpaired from device");
          } else if (data.status === "playing") {
            setPlaying(true);
            setStatus("Playing");
            showTemporaryToast("Stream started");
          } else if (data.status === "stopped") {
            setPlaying(false);
            setStatus("Stopped");
            showTemporaryToast("Stream stopped");
          }
        } catch (e) {
          console.error("Failed to parse message:", e);
        }
      };

      socket.onerror = (e) => {
        console.error("WebSocket error:", e);
        setConnected(false);
        displayTemporaryError(
          "Connection error. Please check your device ID and try again.",
        );
      };

      socket.onclose = () => {
        console.log("WebSocket closed");
        setConnected(false);
        setPaired(false);
        setPlaying(false);
        setStatus("Disconnected");
        setWs(null);
      };

      setWs(socket);
    } catch (err) {
      console.error("Failed to create WebSocket:", err);
      displayTemporaryError(
        "Failed to connect to server. Please check your network connection.",
      );
    }
  };

  const sendCommand = (command: string, payload: string = "") => {
    if (!ws || ws.readyState !== WebSocket.OPEN) {
      displayTemporaryError("WebSocket is not connected");
      return;
    }

    try {
      const message = JSON.stringify({
        command,
        payload,
      });

      ws.send(message);
      console.log(`Sent ${command} command`);

      if (command === "Pair") {
        setStatus("Paired");
        setPaired(true);
      } else if (command === "Play") {
        setStatus("Started");
        setPlaying(true);

        if (payload && !recentStreams.includes(payload)) {
          const updatedStreams = [payload, ...recentStreams.slice(0, 4)];
          setRecentStreams(updatedStreams);

          try {
            localStorage.setItem(
              "recentStreams",
              JSON.stringify(updatedStreams),
            );
          } catch (e) {
            console.error("Failed to save recent streams:", e);
          }
        }
      } else if (command === "Stop") {
        setStatus("Stoped");
        setPlaying(false);
      } else if (command === "Unpair") {
        setStatus("Unpaired");
        setPaired(false);
      }
    } catch (err) {
      console.error("Failed to send command:", err);
      displayTemporaryError("Failed to send command");
    }
  };

  const handleConnect = () => {
    if (!deviceId) {
      displayTemporaryError("Please enter a device ID");
      return;
    }
    connectWebSocket(deviceId, secret);
  };

  const handleDisconnect = () => {
    if (ws) {
      ws.close();
      showTemporaryToast("Disconnected from server");
    }
  };

  const handlePlayStream = () => {
    if (!playUrl) {
      displayTemporaryError("Please enter a stream URL");
      return;
    }
    sendCommand("Play", playUrl);
  };

  const handleStreamSelect = (url: string) => {
    setPlayUrl(url);
    setShowRecent(false);
    if (streamInputRef.current) {
      streamInputRef.current.focus();
    }
  };

  const handleQRScan = () => {
    showTemporaryToast("QR scan functionality would be implemented here");
  };

  return (
    <div className="relative min-h-screen flex flex-col text-white bg-[#08192D]">
      <main className="flex-1 pt-16 pb-4 px-4 max-w-md mx-auto w-full">
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-4 mt-4 shadow-md">
            <span className="block">{error}</span>
          </div>
        )}

        <div className="mb-6 text-center">
          <img
            src="/logo.png"
            alt="Televiu Logo"
            className="w-16 h-16 mx-auto mb-2"
          />
        </div>

        <div className="bg-[#1A4576] p-4 rounded-lg mb-4">
          <div className="text-sm font-semibold text-white mb-2">
            Connection Status
          </div>
          <div className="flex items-center">
            <div
              className={`w-3 h-3 rounded-full mr-2 ${
                connected ? "bg-green-500" : "bg-red-500"
              }`}
            >
            </div>
            <span>{status}</span>
          </div>
        </div>

        {!connected
          ? (
            <div className="bg-[#1A4576] p-4 rounded-lg shadow-md mt-4">
              <h2 className="text-lg font-bold mb-4">Connect to Device</h2>

              <div className="mb-4 relative">
                <label
                  htmlFor="deviceId"
                  className="block text-sm font-medium text-white mb-1"
                >
                  Device ID
                </label>
                <div className="flex">
                  <input
                    type="text"
                    id="deviceId"
                    value={deviceId}
                    onChange={(e) =>
                      setDeviceId((e.target as HTMLInputElement).value)}
                    className="flex-1 px-3 py-3 border border-gray-300 rounded-l-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-black text-base"
                    placeholder="Enter device ID"
                  />
                  <button
                    onClick={handleQRScan}
                    className="bg-blue-600 px-3 rounded-r-md"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    >
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2">
                      </rect>
                      <rect x="7" y="7" width="3" height="3"></rect>
                      <rect x="14" y="7" width="3" height="3"></rect>
                      <rect x="7" y="14" width="3" height="3"></rect>
                      <rect x="14" y="14" width="3" height="3"></rect>
                    </svg>
                  </button>
                </div>
              </div>

              <div className="mb-5">
                <label
                  htmlFor="secretKey"
                  className="block text-sm font-medium text-white mb-1"
                >
                  Secret Key (optional)
                </label>
                <input
                  type="password"
                  id="secretKey"
                  value={secret}
                  onChange={(e) =>
                    setSecret((e.target as HTMLInputElement).value)}
                  className="w-full px-3 py-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-black text-base"
                  placeholder="Enter secret key if required"
                />
              </div>

              <button
                onClick={handleConnect}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-md text-lg shadow-md active:transform active:scale-95 transition-transform"
              >
                Connect
              </button>
            </div>
          )
          : (
            <div className="space-y-4 mt-4">
              {/* Device Control Panel */}
              <div className="bg-[#1A4576] p-4 rounded-lg shadow-md">
                <h2 className="text-lg font-bold mb-3">Device Control</h2>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => sendCommand("Pair")}
                    disabled={paired}
                    className={`font-bold py-3 px-2 rounded-md flex items-center justify-center ${
                      paired
                        ? "bg-gray-500 text-gray-300 opacity-60"
                        : "bg-green-600 hover:bg-green-700 text-white active:transform active:scale-95 transition-transform"
                    }`}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      className="mr-2"
                    >
                      <path d="M20 11a8.1 8.1 0 0 0-15.5-2m-.5-5v5h5"></path>
                      <path d="M4 13a8.1 8.1 0 0 0 15.5 2m.5 5v-5h-5"></path>
                    </svg>
                    Pair
                  </button>

                  <button
                    onClick={() => sendCommand("Unpair")}
                    disabled={!paired}
                    className={`font-bold py-3 px-2 rounded-md flex items-center justify-center ${
                      !paired
                        ? "bg-gray-500 text-gray-300 opacity-60"
                        : "bg-red-600 hover:bg-red-700 text-white active:transform active:scale-95 transition-transform"
                    }`}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      className="mr-2"
                    >
                      <path d="m18 6-12 12"></path>
                      <path d="m6 6 12 12"></path>
                    </svg>
                    Unpair
                  </button>
                </div>
              </div>

              {/* Stream Control - Only show if paired */}
              {paired && (
                <div className="bg-[#1A4576] p-4 rounded-lg shadow-md">
                  <h2 className="text-lg font-bold mb-3">Stream Control</h2>

                  <div className="mb-4 relative">
                    <label
                      htmlFor="streamUrl"
                      className="block text-sm font-medium text-white mb-1"
                    >
                      Stream URL
                    </label>
                    <div className="flex mb-1">
                      <input
                        ref={streamInputRef}
                        type="text"
                        id="streamUrl"
                        value={playUrl}
                        onChange={(e) =>
                          setPlayUrl((e.target as HTMLInputElement).value)}
                        className="flex-1 px-3 py-3 border border-gray-300 rounded-l-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-black text-base"
                        placeholder="Enter stream URL"
                      />
                      <button
                        onClick={() => setShowRecent(!showRecent)}
                        className="bg-blue-600 px-3 rounded-r-md"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="20"
                          height="20"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          stroke-width="2"
                          stroke-linecap="round"
                          stroke-linejoin="round"
                        >
                          <polyline points="6 9 12 15 18 9"></polyline>
                        </svg>
                      </button>
                    </div>

                    {showRecent && recentStreams.length > 0 && (
                      <div className="absolute z-10 mt-1 w-full bg-white rounded-md shadow-lg max-h-56 overflow-y-auto text-black">
                        {recentStreams.map((url, index) => (
                          <div
                            key={index}
                            className="text-sm p-3 hover:bg-gray-100 cursor-pointer truncate border-b border-gray-100"
                            onClick={() => handleStreamSelect(url)}
                          >
                            {url}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={handlePlayStream}
                      disabled={playing}
                      className={`font-bold py-3 px-2 rounded-md flex items-center justify-center ${
                        playing
                          ? "bg-gray-500 text-gray-300 opacity-60"
                          : "bg-blue-600 hover:bg-blue-700 text-white active:transform active:scale-95 transition-transform"
                      }`}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        className="mr-2"
                      >
                        <polygon points="5 3 19 12 5 21 5 3"></polygon>
                      </svg>
                      Play
                    </button>

                    <button
                      onClick={() => sendCommand("Stop")}
                      disabled={!playing}
                      className={`font-bold py-3 px-2 rounded-md flex items-center justify-center ${
                        !playing
                          ? "bg-gray-500 text-gray-300 opacity-60"
                          : "bg-yellow-600 hover:bg-yellow-700 text-white active:transform active:scale-95 transition-transform"
                      }`}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        className="mr-2"
                      >
                        <rect x="6" y="6" width="12" height="12"></rect>
                      </svg>
                      Stop
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
      </main>

      {showToast && (
        <div className="fixed bottom-6 left-0 right-0 mx-auto w-4/5 max-w-md bg-gray-800 text-white py-3 px-4 rounded-lg shadow-lg text-center transition-opacity duration-300 z-50">
          {toastMessage}
        </div>
      )}
    </div>
  );
}
