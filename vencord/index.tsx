/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 brainage04
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { definePluginSettings } from "@api/Settings";
import { getUniqueUsername, openUserProfile } from "@utils/discord";
import { OptionType, type PluginDef } from "@utils/types";
import type { OnlineStatus, User } from "@vencord/discord-types";
import { findByPropsLazy } from "@webpack";
import { Button, NotificationSettingsStore, PresenceStore, UserStore } from "@webpack/common";

import { isDiscordUserId, isOfflineToOnline, normalizeTarget, statusLabel } from "../common/statusTransition";

const TEST_USERNAME = "brainage04";

interface DiscordNotificationOptions {
    isUserAvatar?: boolean;
    omitClickTracking?: boolean;
    omitViewTracking?: boolean;
    onClick?(): void;
    sound?: string;
    tag?: string;
    volume?: number;
}

interface DiscordNotificationUtils {
    showNotification(
        icon: string | undefined,
        title: string,
        body: string,
        trackingProps: Record<string, never>,
        options: DiscordNotificationOptions
    ): Promise<unknown>;
}

const DiscordNotifications = findByPropsLazy("showNotification", "playNotificationSound") as DiscordNotificationUtils;

let running = false;
let trackedUserId: string | undefined;
let lastStatus: OnlineStatus | undefined;

const settings = definePluginSettings({
    targetUsername: {
        type: OptionType.STRING,
        description: "Exact Discord username (without @) or user ID to watch",
        default: "irieclinic",
        onChange: resetTrackedUser
    },
    testTransition: {
        type: OptionType.COMPONENT,
        component: () => (
            <Button onClick={runTestTransition}>
                Test Offline → Online notification as {TEST_USERNAME}
            </Button>
        )
    }
});

function findTargetUser(): User | undefined {
    const target = normalizeTarget(settings.store.targetUsername);
    if (!target) return;

    if (isDiscordUserId(target)) return UserStore.getUser(target);

    let match: User | undefined;
    UserStore.forEach(user => {
        if (user.username.toLowerCase() !== target) return;
        match = user;
        return false;
    });
    return match;
}

function refreshTrackedUser() {
    const user = findTargetUser();
    if (user?.id === trackedUserId) return;

    trackedUserId = user?.id;
    lastStatus = user ? PresenceStore.getStatus(user.id) : undefined;
}

function resetTrackedUser() {
    trackedUserId = undefined;
    lastStatus = undefined;
    if (running) refreshTrackedUser();
}

function notifyOnline(username: string, status: OnlineStatus, user?: User) {
    const title = `${username} is online`;
    const body = `${username} went from Offline to ${statusLabel(status)}.`;
    const sound = NotificationSettingsStore.isSoundDisabled("message1") ? undefined : "message1";

    void DiscordNotifications.showNotification(
        user?.getAvatarURL(undefined, 128, false),
        title,
        body,
        {},
        {
            isUserAvatar: Boolean(user),
            omitClickTracking: true,
            omitViewTracking: true,
            onClick: user ? () => openUserProfile(user.id) : undefined,
            sound,
            tag: `presence-watcher-${user?.id ?? username}-${Date.now()}`,
            volume: 0.4
        }
    );
}

function handlePresenceChange() {
    if (!trackedUserId) return;

    const currentStatus = PresenceStore.getStatus(trackedUserId);
    if (currentStatus === "unknown" || currentStatus === lastStatus) return;

    const previousStatus = lastStatus;
    lastStatus = currentStatus;

    if (!isOfflineToOnline(previousStatus, currentStatus)) return;

    const user = UserStore.getUser(trackedUserId);
    if (user) notifyOnline(getUniqueUsername(user), currentStatus, user);
}

function runTestTransition() {
    const previousStatus: OnlineStatus = "offline";
    const currentStatus: OnlineStatus = "online";
    if (isOfflineToOnline(previousStatus, currentStatus))
        notifyOnline(TEST_USERNAME, currentStatus, UserStore.getCurrentUser());
}

export const vencordPlugin = {
    description: "Notifies you when one selected Discord user goes from Offline to online, idle, Do Not Disturb, or streaming.",
    tags: ["Friends", "Notifications"],
    authors: [{ name: "brainage04", id: 0n }],
    settings,

    start() {
        running = true;
        UserStore.addChangeListener(refreshTrackedUser);
        PresenceStore.addChangeListener(handlePresenceChange);
        refreshTrackedUser();
    },

    stop() {
        running = false;
        UserStore.removeChangeListener(refreshTrackedUser);
        PresenceStore.removeChangeListener(handlePresenceChange);
        resetTrackedUser();
    }
} satisfies Omit<PluginDef, "name">;
