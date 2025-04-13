import { signal } from "@preact/signals";

export interface Channel {
  id: string;
  name: string;
  description: string;
  thumbnail: string;
  url: string;
}

export const channelSignal = signal<Channel[]>([]);

export function saveChannelsToLocalStorage(channels: Channel[]): void {
  localStorage.setItem("playlist", JSON.stringify(channels));
}

export function loadChannelsFromLocalStorage(): void {
  const raw = localStorage.getItem("playlist");
  if (!raw) return;

  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      channelSignal.value = parsed;
    }
  } catch (e) {
    console.error("Failed to load playlist from localStorage", e);
  }
}

export async function loadChannelsFromText(text: string): Promise<void> {
  const entries: Channel[] = [];
  const lines = text.split(/\r?\n/);

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line.startsWith("#EXTINF")) continue;

    const nextLine = lines[i + 1];
    if (!nextLine || !nextLine.startsWith("http")) continue;

    const logoMatch = line.match(/tvg-logo="(.*?)"/);
    const nameMatch = line.match(/,(.*)$/);
    const logo = logoMatch?.[1]?.trim() || "";
    const name = nameMatch?.[1]?.trim() || "";
    const id = name.toLowerCase().replace(/\W+/g, "");

    entries.push({
      id,
      name,
      description: "Live Now",
      thumbnail: logo,
      url: nextLine.trim(),
    });
  }

  channelSignal.value = entries;

  saveChannelsToLocalStorage(entries);
}

export async function loadChannelsFromFile(file: File): Promise<void> {
  const reader = new FileReader();

  return new Promise((resolve, reject) => {
    reader.onload = async () => {
      try {
        const text = reader.result as string;
        await loadChannelsFromText(text);
        resolve();
      } catch (err) {
        reject(err);
      }
    };

    reader.onerror = () => reject(reader.error);
    reader.readAsText(file);
  });
}
