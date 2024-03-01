import { TextField } from "@mui/material";
import * as React from "react";

interface NumberInputProperties {
    onFinished?: (value: string) => void;
    onBack?: () => void;
    disabled?: boolean;
    autoFocus?: boolean;
}

const NumberInput = React.forwardRef((props: NumberInputProperties, ref: React.MutableRefObject<HTMLElement>): JSX.Element => {
    const [value, setValue] = React.useState("");

    return <TextField
        inputRef={ref}
        value={value}
        inputProps={{className: "text-center !text-2xl"}}
        color={value.length === 1 ? "success" : "info"}
        onChange={(e) => {
            if(e.target.value.length > 1) {
                e.currentTarget.focus();
                e.currentTarget.select();
                props.onFinished?.(value);
                return;
            }

            if(e.target.value.length === 0) {
                setValue("");
                return;
            }

            if(isNaN(Number(e.target.value))) {
                return;
            }

            setValue(e.target.value);

            if(e.target.value.length === 1) {
                props.onFinished?.(e.target.value);
            }
        }}
        onKeyDown={(e) => {
            if(e.key === "Backspace" && !value) {
                e.preventDefault();
                props?.onBack();
                setValue("");
            }
        }}
        onFocus={(e) => {
            e.currentTarget.select();
        }}
        disabled={props.disabled}
        focused={value.length === 1}
        autoFocus={props.autoFocus}
    />;
});

interface TotpInputProperties {
    numberAmount?: number; /** default = 6 */
    autoFocus?: boolean;
    onChange?: (value: string) => void;
    onFinished?: (vaue: string) => void;
}

export default function TotpInput(props: TotpInputProperties): JSX.Element {
    const numberAmount = props.numberAmount ?? 6;
    const refs = new Array(numberAmount).fill(null).map(() => React.useRef(null));
    const numbers = new Array(numberAmount).fill(null).map(() => React.useState(-1));

    React.useEffect(() => {
        if(numbers.some(n => n[0] === -1)) {
            return;
        }

        props.onFinished?.(numbers.map(n => String(n[0])).join(""));
    }, numbers.map(n => n[0]));

    const finished = (target: number, value: string): void => {
        const state = numbers[target];
        const convertedValue = Number(value);
        state[1](convertedValue);

        if(target !== refs.length - 1) {
            refs[target + 1].current.focus();
        }
    };

    const back = (target: number): void => {
        console.log(target);
        numbers[target][1](-1);
        if(target === 0) return;
        refs[target - 1].current.focus();
    };

    return <div className="grid grid-cols-6 gap-2">
        {refs.map((_, index) => <NumberInput
            key={index}
            ref={refs[index]}
            onFinished={outVal => finished(index, outVal)}
            onBack={() => back(index)}
            autoFocus={props.autoFocus && index === 0}
        />)}
    </div>;
}
