import React from "react";
import IDatabridgeClientProtocol from "@extensions/Core.Databridge/protocols/IDatabridgeClientProtocol";
import { useDatabridgeSyncPropery } from "@extensions/Core.Databridge.React/hooks";

interface SyncedTextAreaProps {
    htmlProps?: React.HTMLProps<HTMLTextAreaElement>;
    databridge: IDatabridgeClientProtocol;
    dbKey: string;
    defaultValue?: React.HTMLProps<HTMLTextAreaElement>["value"];
}

export default function SyncedTextArea(props: SyncedTextAreaProps) {
    const [value, setValue] = useDatabridgeSyncPropery({
        databridge: props.databridge,
        key: props.dbKey,
        defaultValue: props.defaultValue || ""
    });

    return <textarea
        {...(props.htmlProps || {})}
        value={value}
        onChange={e => setValue(e.target.value)}
    ></textarea>;
}
