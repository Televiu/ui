import { h } from "preact";
import { useEffect, useRef, useState } from "preact/hooks";
import {
  channelSignal,
  loadChannelsFromLocalStorage,
} from "../utils/channelStore.ts";

export default function Channels() {
  const [focusedIndex, setFocusedIndex] = useState(0);
  const [colSize, setColSize] = useState(3);
  const [digitBuffer, setDigitBuffer] = useState("");
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);
  const digitTimeoutRef = useRef<number | null>(null);
  const selectedRef = useRef<HTMLDivElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (channelSignal.value.length === 0) {
      loadChannelsFromLocalStorage();

      requestAnimationFrame(() => {
        if (channelSignal.value.length === 0) {
          setError(true);
        }
        setLoading(false);
      });
    } else {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedRef.current) {
      selectedRef.current.focus();
      selectedRef.current.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
        inline: "center",
      });
    }
  }, [focusedIndex]);

  useEffect(() => {
    const container = containerRef.current;
    const cardWidthWithMargin = 220 + 16;

    const updateColSize = () => {
      if (container) {
        const width = container.offsetWidth;
        const columns = Math.max(1, Math.floor(width / cardWidthWithMargin));
        setColSize(columns);
      }
    };

    const resizeObserver = new ResizeObserver(updateColSize);
    if (container) resizeObserver.observe(container);
    updateColSize();

    return () => {
      if (container) resizeObserver.unobserve(container);
    };
  }, []);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (
        ["ArrowRight", "ArrowLeft", "ArrowDown", "ArrowUp", "Enter"].includes(
          e.key,
        )
      ) {
        e.preventDefault();
      }

      if (e.key === "ArrowRight") {
        setFocusedIndex((prev) =>
          Math.min(prev + 1, channelSignal.value.length - 1)
        );
      }

      if (e.key === "ArrowLeft") {
        setFocusedIndex((prev) => Math.max(prev - 1, 0));
      }

      if (e.key === "ArrowDown") {
        setFocusedIndex((prev) =>
          Math.min(prev + colSize, channelSignal.value.length - 1)
        );
      }

      if (e.key === "ArrowUp") {
        setFocusedIndex((prev) => Math.max(prev - colSize, 0));
      }

      if (e.key === "Enter") {
        const selected = channelSignal.value[focusedIndex];
        if (selected) {
          window.location.href = `/player?index=${focusedIndex}`;
        }
      }

      if (/^\d$/.test(e.key)) {
        setDigitBuffer((prev) => {
          const newBuffer = prev + e.key;

          if (digitTimeoutRef.current !== null) {
            clearTimeout(digitTimeoutRef.current);
          }

          digitTimeoutRef.current = window.setTimeout(() => {
            const number = parseInt(newBuffer, 10);
            if (
              !isNaN(number) && number > 0 &&
              number <= channelSignal.value.length
            ) {
              setFocusedIndex(number - 1);
            }
            setDigitBuffer("");
          }, 1000);

          return newBuffer;
        });
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [focusedIndex, colSize]);

  if (loading) {
    return (
      <div class="min-h-screen flex items-center justify-center bg-[#08192D] text-white">
        <div class="flex flex-col items-center space-y-4">
          <div class="h-16 w-16 border-4 border-white border-t-transparent rounded-full animate-spin" />
          <p class="text-lg">Loading channels...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        class="min-h-screen text-white flex flex-col items-center justify-center text-center px-6"
        style="background-color: #08192D"
      >
        <h1 class="text-2xl font-bold mb-4">Unable to load channels</h1>
        <p class="mb-6 text-gray-300">
          No channels were found. Please upload a playlist file or try again.
        </p>
        <button
          class="text-black font-bold py-2 px-6 rounded-full text-lg"
          style="background-color: #1A4576"
          onClick={() => window.location.href = "/"}
          onKeyDown={(e) => e.key === "Enter" && (window.location.href = "/")}
        >
          ← Back to Setup
        </button>
      </div>
    );
  }

  return (
    <div class="relative min-h-screen bg-[#0A1A2D] text-white overflow-x-hidden px-6 py-8">
      {digitBuffer && (
        <div class="fixed top-6 right-6 bg-black/70 text-white text-5xl font-bold px-6 py-2 rounded-xl shadow-lg z-50">
          {digitBuffer}
        </div>
      )}

      <div class="flex justify-between items-center mb-10">
        <div class="flex items-center mx-auto">
          <img src="/logo.png" alt="Televiu Logo" class="h-24 w-auto" />
        </div>
      </div>

      <h2 class="text-2xl font-bold mb-4">All Channels</h2>
      <div ref={containerRef} class="flex flex-wrap gap-4 justify-center">
        {channelSignal.value.map((channel, index) => {
          const isFocused = index === focusedIndex;
          return (
            <div
              key={channel.id}
              ref={isFocused ? selectedRef : null}
              tabIndex={0}
              onClick={() => (window.location.href = `/player?index=${index}`)}
              class={`relative w-[220px] h-48 rounded-xl shadow-md cursor-pointer transition duration-150 overflow-hidden flex flex-col justify-end focus:outline-none m-2
                ${
                isFocused
                  ? "ring-4 ring-yellow-400 scale-105"
                  : "hover:ring-2 hover:ring-blue-500"
              }`}
            >
              <LazyThumbnail
                src={channel.thumbnail || "/default-thumbnail.jpg"}
                alt={channel.name}
              />
              <div class="relative z-10 px-4 py-3 bg-gradient-to-t from-[#0A1A2D]/90 via-[#0A1A2D]/60 to-transparent">
                <div class="flex justify-between items-center mb-1">
                  <span class="text-sm font-bold text-gray-300">
                    #{index + 1}
                  </span>
                  <span class="text-sm font-semibold text-white">
                    {channel.name}
                  </span>
                </div>
                <p class="text-sm text-gray-200 truncate">
                  {channel.description}
                </p>
                {isFocused && (
                  <p class="text-right text-sm text-yellow-300 mt-2">
                    Press Enter to Watch
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function LazyThumbnail({ src, alt }: { src: string; alt: string }) {
  const [isVisible, setIsVisible] = useState(false);
  const imgRef = useRef<HTMLImageElement | null>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: "100px" },
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <img
      ref={imgRef}
      src={isVisible ? src : undefined}
      alt={alt}
      class="absolute inset-0 w-full h-full object-cover opacity-40 bg-gray-800"
    />
  );
}
