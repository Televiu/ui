import { h } from "preact";
import Screen from "../islands/Screen.tsx";

export default function ScreenPage() {
  const tls = Deno.env.get("TELEVIU_TLS") ?? "false";

  const server_address = Deno.env.get("TELEVIU_SERVER_ADDRESS") ??
    "localhost:9000";

  const ui_address = Deno.env.get("TELEVIU_UI_ADDRESS") ?? "localhost:8000";

  return (
    <Screen
      server_address={server_address}
      ui_address={ui_address}
      http_scheme={tls == "true" ? "https" : "http"}
      websocket_scheme={tls == "true" ? "wss" : "ws"}
    />
  );
}
