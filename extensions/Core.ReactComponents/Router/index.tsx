import React from "react";

const recursiveFind = (children, toFind: string) => {
    if(!children) return null;

    if(Array.isArray(children)) {
        return children.map(c => recursiveFind(c, toFind))
            .find(Boolean);
    }

    return children.key === toFind ? children : null;
};

export default function Router({children, currentPage}) {
    // children?.find?.(x => x?.find?.(y => y.key === currentPage) || x.key === currentPage) || children.key === currentPage && children
    const result = recursiveFind(children, currentPage);
    return result;
};
