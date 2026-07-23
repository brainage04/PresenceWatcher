import { storage } from "@vendetta/plugin";

export interface PresenceWatcherStorage {
    targetUsername: string;
}

export const pluginStorage = storage as PresenceWatcherStorage;

export function initializeStorage() {
    pluginStorage.targetUsername ??= "irieclinic";
}
