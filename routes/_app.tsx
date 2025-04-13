import { type PageProps } from "$fresh/server.ts";
import { Loader } from "../islands/Loader.tsx";

export default function App({ Component }: PageProps) {
  return (
    <html>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Televiu</title>
        <link rel="stylesheet" href="/styles.css" />
        <link rel="stylesheet" href="/remixicon/remixicon.css" />

        <script src="/tailwind.js"></script>
        <script src="/hls.js"></script>
      </head>
      <body>
        <Loader>
          <Component />
        </Loader>
      </body>
    </html>
  );
}
