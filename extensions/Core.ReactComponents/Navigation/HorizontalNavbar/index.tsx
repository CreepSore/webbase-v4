import * as React from "react";
import INavigator from "../INavigator";

interface BasicButtonProps {
    navKey: string;
    label: string;
    submenu?: BasicButtonProps[];
}

function BasicButton(props: BasicButtonProps & INavigator & {className?: string, active?: boolean}): JSX.Element {
    const buttonRef = React.useRef<HTMLButtonElement>(null);

    return <button
        ref={buttonRef}
        className={`
            cursor-pointer
            disabled:cursor-auto
            bg-gray-700
            text-white
            hover:bg-gray-500
            ${props.submenu ? "text-green-200" : ""}
            ${props.active ? "bg-gray-600" : ""}
            ${props.className || ""}
        `}
        onClick={() => props.onNavigationRequest(props.navKey, {
            ...props,
            position: {
                x: buttonRef.current?.offsetLeft + buttonRef.current?.clientLeft,
                y: buttonRef.current?.offsetTop + buttonRef.current?.clientTop + buttonRef.current?.clientHeight,
            },
        })}
    >
        {props.label}
    </button>;
}

interface DropdownMenuProps extends INavigator {
    position: {x: number, y: number};
    buttons: BasicButtonProps[];
}

function DropdownMenu(props: DropdownMenuProps): JSX.Element {
    return <div
        className="fixed grid grid-cols-1"
        style={{
            top: props.position.y,
            left: props.position.x,
        }}
    >
        {props.buttons.map(entry => <BasicButton
            key={entry.navKey}
            {...entry}
            className={"p-1 pr-3"}
            onNavigationRequest={(key, sender) => props.onNavigationRequest(key, sender)}
        />)}
    </div>;
}

export interface HorizontalNavbarProps extends INavigator {
    activeKey: string;
    entries: BasicButtonProps[];
}

export default function HorizontalNavbar(props: HorizontalNavbarProps): JSX.Element {
    const [dropdownPos, setDropdownPos] = React.useState({x: -9000, y: -9000});
    const [activeDropdown, setActiveDropdown] = React.useState<BasicButtonProps>(null);

    const openDropdown = (dropdown: BasicButtonProps): void => {
        setActiveDropdown(dropdown);
    };

    return <>
        {activeDropdown && <DropdownMenu
            position={dropdownPos}
            buttons={activeDropdown.submenu}
            onNavigationRequest={(key, sender: BasicButtonProps & {position: {x: number, y: number}}) => {
                if(activeDropdown?.navKey === key) {
                    setActiveDropdown(null);
                }
                else if(sender.submenu) {
                    openDropdown(sender);
                    setDropdownPos(sender.position);
                }
                else {
                    props.onNavigationRequest(key, sender);
                }
            }}
        />}

        <div className="w-full bg-gray-700">
            {props.entries.map(entry => <BasicButton
                {...entry}
                active={props.activeKey === entry.navKey}
                className={"py-0.5 px-2"}
                key={entry.navKey}
                onNavigationRequest={(key, sender: BasicButtonProps & {position: {x: number, y: number}}) => {
                    if(activeDropdown?.navKey === key) {
                        setActiveDropdown(null);
                    }
                    else if(sender.submenu) {
                        setDropdownPos(sender.position);
                        openDropdown(sender);
                    }
                    else {
                        props.onNavigationRequest(key, sender);
                    }
                }}
            />)}
        </div>
    </>;
}
