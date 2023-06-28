import * as React from "react";
import ICookieHandler from "../ICookieHandler";

interface CookieDialogProps extends ICookieHandler {
    children: React.ReactElement[] | React.ReactElement;
    cookieTypes: {key: string, label: string, checked?: boolean, isFixedValue?: boolean}[];
}

export default function CookieDialog(props: CookieDialogProps): JSX.Element {
    const [selectedCookies, setSelectedCookies] = React.useState<string[]>(props.cookieTypes.filter(ct => ct.checked === true).map(ct => ct.key));

    return <div className="fixed top-0 right-0 bottom-0 left-0 backdrop-blur-lg bg-white/50 z-[999]">
        <div className="fixed bottom-0 left-0 right-0 mx-auto bg-slate-400 text-white max-w-[500px] py-4 selection:bg-slate-200 selection:text-black">
            <div className="grid grid-cols-1 gap-2">
                <h1 className="text-xl text-center bg-slate-600 text-white mx-[-0.5rem] py-2 rounded-lg">We do use cookies!</h1>

                <div className="text-white px-2">
                    {props.children}
                </div>

                <div className="grid grid-cols-1 gap-2 text-lg mt-4 px-2">
                    <div>Please specify the cookies that you are ok with us to use:</div>
                    {props.cookieTypes.map((cookieType) => <div key={cookieType.key}>
                        <input
                            type="checkbox"
                            name={`cookiedialog-cookies-${cookieType.key}`}
                            id={`cookiedialog-cookies-${cookieType.key}`}
                            checked={cookieType.checked === true}
                            onChange={(e) => {
                                if(e.currentTarget.checked) {
                                    const newCookies = selectedCookies.filter((cookie) => cookie !== cookieType.key);
                                    setSelectedCookies(newCookies);
                                }
                                else {
                                    const newCookies = [...selectedCookies, cookieType.key];
                                    setSelectedCookies(newCookies);
                                }
                            }}
                            disabled={cookieType.isFixedValue === true}
                        />
                        <label htmlFor={`cookiedialog-cookies-${cookieType.key}`}>{cookieType.label}</label>
                    </div>)}
                </div>

                <div className="grid grid-cols-1 gap-1 mt-5">
                    <button
                        className="py-2 px-2 bg-slate-500 border border-gray-300 hover:bg-slate-400 focus:bg-slate-400"
                        onClick={() => props.onCookiesAccepted(selectedCookies)}
                    >Accept checked Cookies</button>
                    <button
                        className="py-2 px-2 bg-slate-500 border border-gray-300 hover:bg-slate-400 focus:bg-slate-400"
                        onClick={() => props.onCookiesDeclined()}
                    >Decline all Cookies</button>
                </div>
            </div>
        </div>
    </div>;
}
