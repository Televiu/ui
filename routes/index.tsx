import { h } from "preact";
import { PageProps } from "$fresh/server.ts";
import Index from "../islands/Index.tsx";

export default function SetupPage(props: PageProps) {
  const mode = Deno.env.get("TELEVIU_UPLOAD_MODE") ?? "both";

  return <Index mode={mode} />;
}
