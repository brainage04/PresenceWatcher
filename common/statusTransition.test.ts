import assert from "node:assert/strict";
import test from "node:test";

import { isDiscordUserId, isOfflineToOnline, normalizeTarget, statusLabel } from "./statusTransition";

test("only offline or invisible to a visible status triggers", () => {
    assert.equal(isOfflineToOnline("offline", "online"), true);
    assert.equal(isOfflineToOnline("invisible", "dnd"), true);
    assert.equal(isOfflineToOnline("idle", "online"), false);
    assert.equal(isOfflineToOnline(undefined, "online"), false);
    assert.equal(isOfflineToOnline("offline", "unknown"), false);
});

test("normalizes usernames and recognizes Discord snowflakes", () => {
    assert.equal(normalizeTarget("  @BrainAge04 "), "brainage04");
    assert.equal(isDiscordUserId("123456789012345678"), true);
    assert.equal(isDiscordUserId("brainage04"), false);
});

test("formats presence labels consistently across platforms", () => {
    assert.equal(statusLabel("dnd"), "Do Not Disturb");
    assert.equal(statusLabel("streaming"), "Streaming");
    assert.equal(statusLabel("invisible"), "Offline");
});
