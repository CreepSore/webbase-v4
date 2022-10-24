// @ts-nocheck

export default function Test() {
    let [val, setVal] = React.useState("");

    return <>
        <input type="text" value={val} onChange={e => setVal(e.target.value)} />
        <button onClick={() => alert(val)}>Oida</button>
    </>;
}

window.loaded = Test;
