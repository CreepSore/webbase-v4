import * as React from "react";
import FullNavigator from "./FullNavigator";

const NavigatorContext = React.createContext<FullNavigator<any, any>>(null);

export default NavigatorContext;
