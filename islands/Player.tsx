import { h } from "preact";
import { useEffect, useRef, useState } from "preact/hooks";
import {
  channelSignal,
  loadChannelsFromLocalStorage,
} from "../utils/channelStore.ts";

export default function Player() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);
  const hideTimeout = useRef<number | null>(null);

  const [focusedIndex, setFocusedIndex] = useState(0);
  const buttonRefs = useRef<Array<HTMLButtonElement | null>>([]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60).toString().padStart(2, "0");
    const secs = Math.floor(seconds % 60).toString().padStart(2, "0");
    return `${mins}:${secs}`;
  };

  useEffect(() => {
    const setup = async () => {
      try {
        loadChannelsFromLocalStorage();
        const video = videoRef.current!;
        const params = new URLSearchParams(window.location.search);
        const index = parseInt(params.get("index") || "0", 10);

        const channel = channelSignal.value[index];

        if (!channel || !channel.url) {
          setError(true);
          return;
        }

        const streamUrl = channel.url;

        console.log("Stream URL:", streamUrl);

        const onVideoPlay = () => {
          setIsPlaying(true);
          setLoading(false);
          if (errorTimeout) clearTimeout(errorTimeout);
        };

        const onVideoPause = () => setIsPlaying(false);
        const onTimeUpdate = () => setCurrentTime(video.currentTime);
        const onDurationChange = () => setDuration(video.duration);

        if ((window as any).Hls?.isSupported()) {
          const hls = new (window as any).Hls();
          hls.loadSource(streamUrl);
          hls.attachMedia(video);
          hls.on((window as any).Hls.Events.MANIFEST_PARSED, () => {
            video.play();
          });
        } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
          video.src = streamUrl;
          video.play();
        } else {
          setError(true);
        }

        video.addEventListener("play", onVideoPlay);
        video.addEventListener("pause", onVideoPause);
        video.addEventListener("timeupdate", onTimeUpdate);
        video.addEventListener("durationchange", onDurationChange);

        errorTimeout = setTimeout(() => {
          if (!video.paused && video.currentTime > 0) return;
          setError(true);
        }, 10000);
      } catch (err) {
        console.error("Error loading video:", err);
        setError(true);
      }
    };

    let errorTimeout: number | null = null;
    setup();

    return () => {
      if (errorTimeout) clearTimeout(errorTimeout);
    };
  }, []);

  const togglePlay = () => {
    const video = videoRef.current!;
    video.paused ? video.play() : video.pause();
  };

  const skip = (amount: number) => {
    const video = videoRef.current!;
    video.currentTime = Math.min(
      video.duration,
      Math.max(0, video.currentTime + amount),
    );
  };

  const stop = () => {
    const video = videoRef.current!;
    video.pause();
    video.currentTime = 0;
  };

  useEffect(() => {
    const resetTimer = () => {
      setShowControls(true);
      if (hideTimeout.current) clearTimeout(hideTimeout.current);
      hideTimeout.current = setTimeout(() => setShowControls(false), 3000);
    };

    document.addEventListener("mousemove", resetTimer);
    resetTimer();

    return () => {
      document.removeEventListener("mousemove", resetTimer);
      if (hideTimeout.current) clearTimeout(hideTimeout.current);
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!showControls) setShowControls(true);

      if (e.key === "ArrowRight") {
        setFocusedIndex((prev) => (prev + 1) % 5);
      } else if (e.key === "ArrowLeft") {
        setFocusedIndex((prev) => (prev - 1 + 5) % 5);
      } else if (e.key === "Enter") {
        buttonRefs.current[focusedIndex]?.click();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [focusedIndex, showControls]);

  if (error) {
    return (
      <div class="min-h-screen bg-black text-white flex flex-col items-center justify-center text-center px-6">
        <h1 class="text-2xl font-bold mb-4">
          Unable to load the selected channel
        </h1>
        <p class="mb-6 text-gray-300">
          The channel could not be found or failed to load. Please try again.
        </p>
        <button
          class="text-black font-bold py-2 px-6 rounded-full text-lg"
          style="background-color: #1A4576"
          onClick={() => window.location.href = "/channels"}
          onKeyDown={(e) =>
            e.key === "Enter" && (window.location.href = "/channels")}
        >
          ← Back to Channels
        </button>
      </div>
    );
  }

  const actions = [
    () => skip(-30),
    () => skip(-10),
    stop,
    () => skip(10),
    togglePlay,
  ];

  const icons = [
    "ri-rewind-fill",
    "ri-arrow-left-s-fill",
    "ri-stop-fill",
    "ri-arrow-right-s-fill",
    isPlaying ? "ri-pause-fill" : "ri-play-fill",
  ];

  return (
    <div class="relative min-h-screen flex flex-col justify-end bg-black text-white">
      <video
        ref={videoRef}
        class="absolute inset-0 w-full h-full object-contain z-0"
        playsInline
        controls={false}
        autoPlay
      />

      {loading && (
        <div class="absolute inset-0 flex items-center justify-center z-10">
          <div class="text-white text-xl flex flex-col items-center gap-4">
            <i class="ri-loader-4-line animate-spin text-5xl"></i>
            <p>Loading channel...</p>
          </div>
        </div>
      )}

      <div
        class={`transition-opacity duration-300 ease-in-out ${
          showControls ? "opacity-100" : "opacity-0"
        } relative z-10 px-6 pb-8 bg-gradient-to-t from-black via-black/60 to-transparent`}
      >
        <div class="flex items-center justify-between text-sm text-white mb-4">
          <span>{formatTime(currentTime)}</span>
          <div class="relative flex-1 h-2 mx-4 bg-gray-600 rounded-full overflow-hidden">
            <div
              class="absolute top-0 left-0 h-full bg-blue-500"
              style={{ width: `${(currentTime / duration) * 100 || 0}%` }}
            />
            <div
              class="absolute w-4 h-4 rounded-full bg-white top-1/2 transform -translate-x-1/2 -translate-y-1/2 shadow"
              style={{ left: `${(currentTime / duration) * 100 || 0}%` }}
            />
          </div>
          <span>{formatTime(duration)}</span>
        </div>

        <div class="flex justify-center gap-6 mt-2">
          {actions.map((action, index) => (
            <SvgButton
              key={index}
              icon={icons[index]}
              onClick={action}
              isFocused={focusedIndex === index}
              buttonRef={(el) => (buttonRefs.current[index] = el)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function SvgButton({
  icon,
  onClick,
  isFocused,
  buttonRef,
}: {
  icon: string;
  onClick: () => void;
  isFocused?: boolean;
  buttonRef: (el: HTMLButtonElement | null) => void;
}) {
  return (
    <button
      ref={buttonRef}
      onClick={onClick}
      class={`w-14 h-14 rounded-full text-xl flex items-center justify-center transition-all duration-200 ${
        isFocused ? "ring-4 ring-white" : ""
      }`}
      style="background-color: #1A4576"
    >
      <i class={icon}></i>
    </button>
  );
}
