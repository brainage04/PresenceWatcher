export type PresenceStatus =
    | "online"
    | "idle"
    | "dnd"
    | "streaming"
    | "offline"
    | "invisible"
    | "unknown";

export function isOfflineToOnline(previous: PresenceStatus | undefined, current: PresenceStatus) {
    const wasOffline = previous === "offline" || previous === "invisible";
    const isNowOffline = current === "offline" || current === "invisible";
    return wasOffline && !isNowOffline && current !== "unknown";
}

export function statusLabel(status: PresenceStatus) {
    switch (status) {
        case "dnd":
            return "Do Not Disturb";
        case "idle":
            return "Idle";
        case "streaming":
            return "Streaming";
        case "offline":
        case "invisible":
            return "Offline";
        case "unknown":
            return "Unknown";
        default:
            return "Online";
    }
}

export function normalizeTarget(value: string) {
    return value.trim().replace(/^@/, "").toLowerCase();
}

export function isDiscordUserId(value: string) {
    return /^\d{17,20}$/.test(value);
}
