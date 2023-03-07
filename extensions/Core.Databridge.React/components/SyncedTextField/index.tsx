import React from "react";
import IDatabridgeClientProtocol from "@extensions/Core.Databridge/protocols/IDatabridgeClientProtocol";
import { useDatabridgeSyncPropery } from "@extensions/Core.Databridge.React/hooks";

interface SyncedInputFieldProps {
    htmlProps?: React.HTMLProps<HTMLInputElement>;
    databridge: IDatabridgeClientProtocol;
    dbKey: string;
    defaultValue?: React.HTMLProps<HTMLInputElement>["value"];
}

export default function SyncedInputField(props: SyncedInputFieldProps) {
    const [value, setValue] = useDatabridgeSyncPropery({
        databridge: props.databridge,
        key: props.dbKey,
        defaultValue: props.defaultValue || ""
    });

    return <input
        {...(props.htmlProps || {})}
        value={value}
        onChange={e => setValue(e.target.value)}
    />;
}
