import * as React from "react";

export default function Testobj() {
    let [text, setText] = React.useState("bruh");

    return <div>
        {text}
    </div>;
}
