import { useEffect, useState } from "preact/hooks";

import Setup from "../components/Setup.tsx";
import Player from "../components/Player.tsx";

type Command = "Pair" | "Unpair" | "Play" | "Stop";

interface Message {
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
  const [error, setError] = useState<string>();
  const [status, setStatus] = useState<string>("Disconnected");
  const [playing, setPlaying] = useState(false);
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [deviceInfo, setDeviceInfo] = useState<{ device: string; secret: string } | null>(null);
  const [streamUrl, setStreamUrl] = useState<string>();

  useEffect(() => {
    setStatus("Connecting to WebSocket...");
    const socket = new WebSocket(
      `${props.websocket_scheme}://${props.server_address}/ws/player`
    );
    setWs(socket);

    socket.onopen = () => {
      setStatus("Connected");
      console.log("WebSocket connection established");
    };

    socket.onmessage = (msgEvent) => {
      try {
        const data: Message = JSON.parse(msgEvent.data);
        console.log("Received message:", data);

        if (data.device && data.secret === "") {
          setDeviceInfo({ device: data.device, secret: data.secret });
          setStatus("Connected");
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
              setStatus("Played");
            }
            break;

          case "Stop":
            setPlaying(false);
            setStatus("Stopped");
            break;

          case "Unpair":
            console.log("Unpair command received, resetting state");
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
      setError("Connection error. Server might be down or under maintenance.");
    };

    socket.onclose = () => {
      console.log("WebSocket closed");
      setError("Connection closed");
      setStatus("Disconnected");
      setWs(null);
    };

    return () => {
      socket.close();
    };
  }, []);

  return (
    <div className="relative min-h-screen flex flex-col justify-center bg-black text-white items-center">
      {!playing && (
        <Setup
          error={error}
          status={status}
          deviceInfo={deviceInfo}
        />
      )}

      {playing && (
        <Player
          streamUrl={streamUrl}
          onStop={() => {
            if (ws?.readyState === WebSocket.OPEN) {
              ws.send(JSON.stringify({ command: "Stop" }));
            }
            setPlaying(false);
            setStatus("Stopped");
          }}
          onEnded={() => {
            console.log("Video playback ended");
            setStatus("Stopped");
            if (ws?.readyState === WebSocket.OPEN) {
              ws.send(JSON.stringify({ command: "Stop" }));
            }
          }}
        />
      )}
    </div>
  );
}

