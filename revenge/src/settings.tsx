import { ReactNative as RN } from "@vendetta/metro/common";
import { useProxy } from "@vendetta/storage";
import { getAssetIDByName } from "@vendetta/ui/assets";
import { Forms } from "@vendetta/ui/components";
import { showToast } from "@vendetta/ui/toasts";

import { statusLabel } from "../../common/statusTransition";
import { pluginStorage } from "./state";

const { FormInput, FormRow, FormSection } = Forms;
const onlineIcon = getAssetIDByName("StatusOnlineIcon") ?? getAssetIDByName("OnlineIcon");

function SettingsContent() {
    useProxy(pluginStorage);

    return (
        <RN.ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 38 }}>
            <FormSection title="Presence watcher" titleStyleType="no_border">
                <FormRow
                    label="Discord username or user ID"
                    subLabel="The exact username may omit its leading @"
                />
                <FormInput
                    title=""
                    placeholder="username or 18-digit ID"
                    value={pluginStorage.targetUsername}
                    onChange={(value: string) => { pluginStorage.targetUsername = value; }}
                    style={{ marginTop: -25, marginHorizontal: 12 }}
                />
                <FormRow
                    label="Test Offline → Online notification"
                    subLabel={`brainage04 went from Offline to ${statusLabel("online")}.`}
                    onPress={() => showToast("brainage04 went from Offline to Online", onlineIcon)}
                />
            </FormSection>
        </RN.ScrollView>
    );
}

export default function Settings() {
    return <SettingsContent />;
}
