import { useEffect, useRef, useState } from "preact/hooks";

interface PlayerProps {
    streamUrl: string | undefined;
    onStop: () => void;
    onEnded: () => void;
}

export default function Player(
    { streamUrl, onStop, onEnded }: PlayerProps,
) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [showControls, setShowControls] = useState(true);
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
        if (!videoRef.current) return;

        const video = videoRef.current;
        setLoading(true);

        const onVideoPlay = () => {
            setIsPlaying(true);
            setLoading(false);
        };

        const onVideoPause = () => setIsPlaying(false);
        const onTimeUpdate = () => setCurrentTime(video.currentTime);
        const onDurationChange = () => setDuration(video.duration);
        const onLoadedData = () => setLoading(false);

        const onVideoError = (e: any) => {
            console.error("Video error:", e);
            setLoading(false);
            onStop();
        };

        const onVideoEnded = () => {
            onEnded();
        };

        video.addEventListener("play", onVideoPlay);
        video.addEventListener("pause", onVideoPause);
        video.addEventListener("timeupdate", onTimeUpdate);
        video.addEventListener("durationchange", onDurationChange);
        video.addEventListener("loadeddata", onLoadedData);
        video.addEventListener("error", onVideoError);
        video.addEventListener("ended", onVideoEnded);

        try {
            if (!streamUrl) return;

            if (Hls?.isSupported()) {
                const hls = new Hls();
                hls.loadSource(streamUrl);
                hls.attachMedia(video);
                hls.on(Hls.Events.MANIFEST_PARSED, () => {
                    video.play().catch(console.error);
                });
            } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
                video.src = streamUrl;
                video.play().catch(console.error);
            } else {
                onVideoError(
                    new Error("Your browser doesn't support HLS streaming."),
                );
            }
        } catch (err) {
            onVideoError(err);
        }

        return () => {
            video.removeEventListener("play", onVideoPlay);
            video.removeEventListener("pause", onVideoPause);
            video.removeEventListener("timeupdate", onTimeUpdate);
            video.removeEventListener("durationchange", onDurationChange);
            video.removeEventListener("loadeddata", onLoadedData);
            video.removeEventListener("error", onVideoError);
            video.removeEventListener("ended", onVideoEnded);
        };
    }, [streamUrl]);

    const togglePlay = () => {
        const video = videoRef.current!;
        if (video.paused) {
            video.play().catch(console.error);
        } else {
            video.pause();
        }
    };

    const skip = (amount: number) => {
        const video = videoRef.current!;
        video.currentTime = Math.min(
            video.duration,
            Math.max(0, video.currentTime + amount),
        );
    };

    const stop = () => {
        onStop();
    };

    useEffect(() => {
        const resetTimer = () => {
            setShowControls(true);
            if (hideTimeout.current) clearTimeout(hideTimeout.current);
            hideTimeout.current = setTimeout(
                () => setShowControls(false),
                3000,
            );
        };

        document.addEventListener("mousemove", resetTimer);
        document.addEventListener("click", resetTimer);
        resetTimer();

        return () => {
            document.removeEventListener("mousemove", resetTimer);
            document.removeEventListener("click", resetTimer);
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
            } else if (e.key === " ") {
                togglePlay();
                e.preventDefault();
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [focusedIndex, showControls]);

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
        <>
            <video
                ref={videoRef}
                className="relative max-w-full max-h-full object-contain z-0 w-full h-full"
                playsInline
                controls={false}
                autoPlay
                crossorigin="anonymous"
            />

            {loading && (
                <div className="absolute inset-0 flex items-center justify-center z-10">
                    <div className="text-white text-xl flex flex-col items-center gap-4">
                        <i className="ri-loader-4-line animate-spin text-5xl">
                        </i>
                        <p>Loading stream...</p>
                    </div>
                </div>
            )}

            <div
                className={`transition-opacity duration-300 ease-in-out ${showControls ? "opacity-100" : "opacity-0"
                    } absolute bottom-0 left-0 right-0 z-10 px-6 pb-8 bg-gradient-to-t from-black via-black/60 to-transparent w-full`}
            >
                <div className="flex items-center justify-between text-sm text-white mb-4">
                    <span>{formatTime(currentTime)}</span>
                    <div className="relative flex-1 h-2 mx-4 bg-gray-600 rounded-full overflow-hidden">
                        <div
                            className="absolute top-0 left-0 h-full bg-blue-500"
                            style={{
                                width: `${(currentTime / duration) * 100 || 0
                                    }%`,
                            }}
                        />
                        <div
                            className="absolute w-4 h-4 rounded-full bg-white top-1/2 transform -translate-x-1/2 -translate-y-1/2 shadow"
                            style={{
                                left: `${(currentTime / duration) * 100 || 0}%`,
                            }}
                        />
                    </div>
                    <span>{formatTime(duration)}</span>
                </div>

                <div className="flex justify-center gap-6 mt-2">
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
        </>
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
            className={`w-14 h-14 rounded-full text-xl flex items-center justify-center transition-all duration-200 ${isFocused ? "ring-4 ring-white" : ""
                }`}
            style={{ backgroundColor: "#1A4576" }}
        >
            <i className={icon}></i>
        </button>
    );
}
