import DatabridgeWebsocketClient from "../Core.Databridge/web/DatabridgeWebsocketClient";

window.addEventListener("load", () => {
    let databridge = new DatabridgeWebsocketClient("/Core.Web/LiveReload");

    databridge.onPacketReceived(() => {
        location.reload();
    });

    databridge.onDisconnected(() => {
        console.log("Connection lost");

        const banner = document.createElement("div");
        banner.innerText = "DATABRIDGE CONNECTION GOT LOST";
        banner.style.position = "sticky";
        banner.style.bottom = "0";
        banner.style.left = "0";
        banner.style.right = "0";
        banner.style.padding = "1em 1em";
        banner.style.background = "red";
        banner.style.color = "white";
        banner.style.fontWeight = "bold";
        banner.style.opacity = "0.75";

        document.querySelector("body").appendChild(banner);
    });

    databridge.connect();
});
