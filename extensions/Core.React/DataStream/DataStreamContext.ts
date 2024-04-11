import * as React from "react";
import useDataStream from "../hooks/useDataStream";

const DataStreamContext = React.createContext<ReturnType<typeof useDataStream>>(null);

export default DataStreamContext;
