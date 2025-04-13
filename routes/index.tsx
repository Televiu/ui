import { h } from "preact";
import { PageProps } from "$fresh/server.ts";
import Setup from "../islands/Setup.tsx";

export default function SetupPage(props: PageProps) {
  const mode = Deno.env.get("TELEVIU_UPLOAD_MODE") ?? "both";

  return <Setup mode={mode} />;
}
