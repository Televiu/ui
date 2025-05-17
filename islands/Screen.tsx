import { h } from "preact";
import { useEffect, useState } from "preact/hooks";
import VideoPlayer from "../components/VideoPlayer.tsx";
import QRSetup from "../components/QRSetup.tsx";
import ErrorDisplay from "../components/ErrorDisplay.tsx";
import { qrcode } from "@libs/qrcode";

type Command = "Pair" | "Unpair" | "Play" | "Stop";

interface WSMessage {
  device?: string;
  secret?: string;
  command?: Command;
  payload?: string;
}

interface ScreenProps {
  server_address: string;
  ui_address: string;
  http_scheme: string;
  websocket_scheme: string;
}

export default function Screen(props: ScreenProps) {
  const [status, setStatus] = useState("Connecting to WebSocket...");
  const [error, setError] = useState("");
  const [serverAvailable, setServerAvailable] = useState(true);
  const [playing, setPlaying] = useState(false);
  const [streamUrl, setStreamUrl] = useState<string | null>(null);
  const [ws, setWs] = useState<WebSocket | null>(null);

  const [qrImage, setQrImage] = useState<string | null>(null);
  const [qrLoading, setQrLoading] = useState(false);
  const [deviceInfo, setDeviceInfo] = useState<
    { device: string; secret: string } | null
  >(null);
  const [registered, setRegistered] = useState(false);

  const resetPlayerState = () => {
    console.log("Resetting player state");
    setPlaying(false);
    setStreamUrl(null);
    setError("");
  };

  const generateQR = (deviceId: string, secret: string) => {
    setQrLoading(true);
    try {
      const rawSvg = qrcode(
        `${props.http_scheme}://${props.ui_address}/controller?device=${deviceId}&secret=${secret}`,
        { output: "svg", ecl: "HIGH" },
      );
      setQrImage(rawSvg);
    } catch (err) {
      console.error("QR generation failed", err);
      setError("QR code unavailable. Please try again later.");
    } finally {
      setQrLoading(false);
    }
  };

  useEffect(() => {
    setStatus("Connecting to WebSocket...");
    const socket = new WebSocket(
      `${props.websocket_scheme}://${props.server_address}/ws/player`,
    );
    setWs(socket);

    const connectionTimeout = setTimeout(() => {
      if (socket.readyState !== WebSocket.OPEN) {
        setServerAvailable(false);
        setError(
          "Connection timeout. Server might be down or under maintenance.",
        );
        socket.close();
      }
    }, 10000);

    socket.onopen = () => {
      setStatus("Connected");
      clearTimeout(connectionTimeout);
      console.log("WebSocket connection established");
    };

    socket.onmessage = (msgEvent) => {
      try {
        const data: WSMessage = JSON.parse(msgEvent.data);
        console.log("Received message:", data);

        if (data.device && data.secret == "") {
          setDeviceInfo({ device: data.device, secret: data.secret });
          setRegistered(true);
          setServerAvailable(true);
          setStatus("Connected");
          generateQR(data.device, data.secret);
          return;
        }

        switch (data.command) {
          case "Pair":
            setStatus("Paired");
            break;
          case "Play":
            if (data.payload) {
              setStreamUrl(data.payload);
              setPlaying(true);
              setStatus("Playing");
            }
            break;
          case "Stop":
            resetPlayerState();
            setStatus("Stopped");
            break;
          case "Unpair":
            console.log("Unpair command received, resetting state");
            resetPlayerState();
            setStatus("Disconnected");
            if (socket.readyState === WebSocket.OPEN) socket.close();
            setTimeout(() => window.location.reload(), 1000);
            break;
        }
      } catch (e) {
        console.error("Failed to parse message:", e);
        setError("Failed to process server message.");
      }
    };

    socket.onerror = (e) => {
      console.error("WebSocket error:", e);
      setServerAvailable(false);
      setError("Connection error. Server might be down or under maintenance.");
    };

    socket.onclose = () => {
      console.log("WebSocket closed");
      if (playing) resetPlayerState();
      setStatus("Disconnected");
      setWs(null);
    };

    return () => {
      clearTimeout(connectionTimeout);
      socket.close();
    };
  }, []);

  if (error || !serverAvailable) {
    return (
      <ErrorDisplay
        error={error}
        serverAvailable={serverAvailable}
        onReconnect={() => window.location.reload()}
        onHome={() => (window.location.href = "/")}
      />
    );
  }

  const showQrCode = !playing && status !== "Disconnected";
  const showReconnectionUi = !playing && status === "Disconnected";

  return (
    <div className="relative min-h-screen flex flex-col justify-center bg-black text-white items-center">
      {playing && streamUrl
        ? (
          <VideoPlayer
            streamUrl={streamUrl}
            onStop={() => {
              if (ws?.readyState === WebSocket.OPEN) {
                ws.send(
                  JSON.stringify({ command: "Stop" }),
                );
              }
              resetPlayerState();
              setStatus("Stopped");
            }}
            onEnded={() => {
              console.log("Video playback ended");
              resetPlayerState();
              setStatus("Stopped");
              if (ws?.readyState === WebSocket.OPEN) {
                ws.send(
                  JSON.stringify({ command: "Stop" }),
                );
              }
            }}
          />
        )
        : (
          <>
            {showQrCode && (
              <QRSetup
                qrLoading={qrLoading}
                registered={registered}
                deviceInfo={deviceInfo}
                status={status}
                qrImage={qrImage}
              />
            )}

            {showReconnectionUi && (
              <div className="flex flex-col items-center justify-center gap-8 p-6 max-w-md mx-auto text-center">
                <div className="w-24 h-24 flex justify-center">
                  <img src="/logo.png" alt="Logo" className="w-full h-auto" />
                </div>

                <h2 className="text-2xl font-bold">Connection Lost</h2>
                <p className="text-gray-300">
                  The connection to the streaming server has been lost. This
                  could be due to network issues or server maintenance.
                </p>

                <div className="flex gap-4 mt-6">
                  <button
                    className="text-black font-bold py-2 px-6 rounded-full text-lg"
                    style={{ backgroundColor: "#1A4576" }}
                    onClick={() => window.location.reload()}
                  >
                    Reconnect
                  </button>
                  <button
                    className="text-white font-bold py-2 px-6 rounded-full text-lg border border-white"
                    onClick={() => (window.location.href = "/")}
                  >
                    Return to Home
                  </button>
                </div>
              </div>
            )}
          </>
        )}
    </div>
  );
}

declare global {
  interface Window {
    qrcode: any;
    QRCode: any;
  }
}
