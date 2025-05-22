interface ErrorProps {
    error: string;
    serverAvailable: boolean;
    onReconnect: () => void;
    onHome: () => void;
}

export default function Error({
    error,
    serverAvailable,
    onReconnect,
    onHome,
}: ErrorProps) {
    return (
        <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center text-center px-6">
            <h1 className="text-2xl font-bold mb-4">
                {!serverAvailable
                    ? "Server Unavailable"
                    : "Connection or Playback Error"}
            </h1>
            <p className="mb-6 text-gray-300">
                {error ||
                    "The streaming server appears to be down or under maintenance. Please try again later."}
            </p>
            <div className="flex gap-4">
                <button
                    className="text-black font-bold py-2 px-6 rounded-full text-lg"
                    style={{ backgroundColor: "#1A4576" }}
                    onClick={onReconnect}
                >
                    Reconnect
                </button>
                <button
                    className="text-white font-bold py-2 px-6 rounded-full text-lg border border-white"
                    onClick={onHome}
                >
                    Return to Home
                </button>
            </div>
        </div>
    );
}
