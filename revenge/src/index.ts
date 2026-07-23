import { findByProps } from "@vendetta/metro";
import { getAssetIDByName } from "@vendetta/ui/assets";
import { showToast } from "@vendetta/ui/toasts";

import {
    isDiscordUserId,
    isOfflineToOnline,
    normalizeTarget,
    type PresenceStatus,
    statusLabel
} from "../../common/statusTransition";
import Settings from "./settings";
import { initializeStorage, pluginStorage } from "./state";

interface RevengeUser {
    id: string;
    username: string;
}

interface UserStoreApi {
    getCurrentUser(): RevengeUser | undefined;
    getUser(id: string): RevengeUser | undefined;
    getUsers?(): Record<string, RevengeUser>;
}

interface PresenceStoreApi {
    getStatus(id: string): PresenceStatus;
}

interface FluxDispatcherApi {
    subscribe(type: string, callback: (event: PresenceEvent) => void): void;
    unsubscribe(type: string, callback: (event: PresenceEvent) => void): void;
}

interface PresenceEvent {
    status?: PresenceStatus;
    user?: { id?: string };
}

// Discord runtime modules are untyped; constrain their known surface once at discovery.
const UserStore = findByProps("getUser", "getCurrentUser") as unknown as UserStoreApi;
const PresenceStore = findByProps("getStatus", "getActivities") as unknown as PresenceStoreApi;
const FluxDispatcher = findByProps("dispatch", "subscribe") as unknown as FluxDispatcherApi;
const onlineIcon = getAssetIDByName("StatusOnlineIcon") ?? getAssetIDByName("OnlineIcon");

let observedTarget = "";
let trackedUserId: string | undefined;
let lastStatus: PresenceStatus | undefined;

function findTargetUser(target: string): RevengeUser | undefined {
    if (!target) return;
    if (isDiscordUserId(target)) return UserStore.getUser(target);

    const users = UserStore.getUsers?.() ?? {};
    return Object.values(users).find(user => user.username.toLowerCase() === target);
}

function refreshTrackedUser() {
    const target = normalizeTarget(pluginStorage.targetUsername);
    if (target === observedTarget && trackedUserId) return;

    observedTarget = target;
    const user = findTargetUser(target);
    trackedUserId = user?.id;
    lastStatus = user ? PresenceStore.getStatus(user.id) : undefined;
}

function handlePresenceUpdate(event: PresenceEvent) {
    refreshTrackedUser();
    if (!trackedUserId || event.user?.id !== trackedUserId) return;

    const currentStatus = event.status ?? PresenceStore.getStatus(trackedUserId);
    if (currentStatus === "unknown" || currentStatus === lastStatus) return;

    const previousStatus = lastStatus;
    lastStatus = currentStatus;
    if (!isOfflineToOnline(previousStatus, currentStatus)) return;

    const user = UserStore.getUser(trackedUserId);
    const username = user?.username ?? trackedUserId;
    showToast(`${username} went from Offline to ${statusLabel(currentStatus)}`, onlineIcon);
}

function handleUserRefresh() {
    observedTarget = "";
    refreshTrackedUser();
}


function onLoad() {
    initializeStorage();
    refreshTrackedUser();
    FluxDispatcher.subscribe("PRESENCE_UPDATE", handlePresenceUpdate);
    FluxDispatcher.subscribe("USER_UPDATE", handleUserRefresh);
    FluxDispatcher.subscribe("CONNECTION_OPEN", handleUserRefresh);
}

function onUnload() {
    FluxDispatcher.unsubscribe("PRESENCE_UPDATE", handlePresenceUpdate);
    FluxDispatcher.unsubscribe("USER_UPDATE", handleUserRefresh);
    FluxDispatcher.unsubscribe("CONNECTION_OPEN", handleUserRefresh);
    observedTarget = "";
    trackedUserId = undefined;
    lastStatus = undefined;
}

export default { onLoad, onUnload, settings: Settings };
