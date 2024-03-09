import * as React from "react";

import CircularProgress from "@mui/material/CircularProgress";
import Paper from "@mui/material/Paper";


interface LoaderProps {

}

export default function Loader(props: LoaderProps): JSX.Element {
    return <Paper className="top-0 right-0 bottom-0 left-0 fixed flex justify-center items-center z-[999]" square>
        <CircularProgress />
    </Paper>;
}
