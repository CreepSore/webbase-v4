import DatabridgeWebsocketClient from "../Core.Databridge/web/DatabridgeWebsocketClient";

window.addEventListener("load", () => {
    let databridge = new DatabridgeWebsocketClient("/Core.Web/LiveReload");

    databridge.onPacketReceived(() => {
        location.reload();
    });

    databridge.connect();
});
