import * as React from "react";
import useMe from "../../hooks/useMe";

const MeContext = React.createContext<ReturnType<typeof useMe>>(null);

export default MeContext;
