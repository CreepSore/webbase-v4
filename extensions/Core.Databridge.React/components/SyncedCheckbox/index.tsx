import React from "react";
import IDatabridgeClientProtocol from "@extensions/Core.Databridge/protocols/IDatabridgeClientProtocol";
import { useDatabridgeSyncPropery } from "@extensions/Core.Databridge.React/hooks";

interface SyncedCheckboxProps {
    htmlProps?: React.HTMLProps<HTMLInputElement>;
    databridge: IDatabridgeClientProtocol;
    dbKey: string;
    defaultValue?: React.HTMLProps<HTMLInputElement>["checked"];
}

export default function SyncedCheckbox(props: SyncedCheckboxProps) {
    const [checked, setChecked] = useDatabridgeSyncPropery<boolean>({
        databridge: props.databridge,
        key: props.dbKey,
        defaultValue: false,
        mapValue: value => {
            return value === "true" || value === true;
        }
    });

    return <input
        {...(props.htmlProps || {})}
        type="checkbox"
        checked={checked}
        onChange={e => setChecked(e.target.checked)}
    />;
}
