import React from "react";

const recursiveFind = (children: any, toFind: string): any => {
    if(!children) return null;

    if(Array.isArray(children)) {
        // @ts-ignore
        return children.map(c => recursiveFind(c, toFind))
            .find(Boolean);
    }

    // @ts-ignore
    return children.key === toFind ? children : null;
};

interface RouterProps {
    children: any;
    currentPage: string;
}

export default function Router(props: RouterProps) {
    // children?.find?.(x => x?.find?.(y => y.key === currentPage) || x.key === currentPage) || children.key === currentPage && children
    const result = recursiveFind(props.children, props.currentPage);
    return result;
};
