import * as React from "react";

interface RouterPageProps {
    children: any
}

export default function RouterPage(props: RouterPageProps): React.ReactElement {
    return (
        <>{props.children}</>
    );
}
