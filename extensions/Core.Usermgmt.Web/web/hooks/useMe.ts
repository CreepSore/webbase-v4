import * as React from "react";
import IUser from "@extensions/Core.Usermgmt/types/IUser";
import UsermgmtWebApi from "../UsermgmtWebApi";

export default function useMe(): [IUser, () => void] {
    const [currentMe, setCurrentMe] = React.useState<IUser>(null);

    const update = (): void => {
        UsermgmtWebApi.me().then(me => setCurrentMe(me));
    };

    React.useEffect(() => {
        update();
    }, []);

    return [currentMe, update];
}
