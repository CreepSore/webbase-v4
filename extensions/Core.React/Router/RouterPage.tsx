import * as React from "react";

interface RouterPageProps {
    children: any
}

export default function RouterPage(props: RouterPageProps): JSX.Element {
    return (
        <>{props.children}</>
    );
}
