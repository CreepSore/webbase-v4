import * as React from "react";
import { LoginControlProperties } from "./LoginControlProperties";
import TotpInput from "../../TotpInput/TotpInput";

export default function PasswordLoginControl(props: LoginControlProperties) {
    return <TotpInput
        onFinished={(totpValue) => {
            props.onChange(totpValue);
        }}
        autoFocus
    />;
}
