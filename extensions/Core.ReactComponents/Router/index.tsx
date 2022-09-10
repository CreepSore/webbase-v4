import React from "react";

export default function Router({children, currentPage}) {
    return (children?.find?.(x => x.key === currentPage) || children.key === currentPage && children);
};
