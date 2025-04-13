import { h } from "preact";
import { useEffect, useState } from "preact/hooks";

export function Loader({ children }: { children: h.JSX.Element }) {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const handleLoad = () => {
      setLoaded(true);
    };

    // Use load event to ensure images, styles, scripts are loaded
    if (document.readyState === "complete") {
      setLoaded(true);
    } else {
      window.addEventListener("load", handleLoad);
    }

    return () => {
      window.removeEventListener("load", handleLoad);
    };
  }, []);

  if (!loaded) {
    return (
      <div
        class="fixed inset-0 z-50 flex items-center justify-center bg-black text-white"
        style="background-color: #08192D"
      >
        <div class="w-16 h-16 border-4 border-white border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return children;
}
