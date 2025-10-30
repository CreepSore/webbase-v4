import DatabridgeBuilder from "../Core.Databridge/DatabridgeBuilder";
import DatabridgeMultiLayer from "../Core.Databridge/layers/DatabridgeMultiLayer";
import DatabridgeLambdaLayer from "../Core.Databridge/layers/misc/DatabridgeLambdaLayer";
import DatabridgeWebsocketLayer from "../Core.Databridge/layers/web/DatabridgeWebsocketLayer";

window.addEventListener("load", async() => {
    const websocketLayer = new DatabridgeWebsocketLayer("/Core.Web/LiveReload");

    const databridge = new DatabridgeBuilder()
        .setInboundLayer(
            new DatabridgeMultiLayer()
                .attachInboundLayer<any, any>(websocketLayer)
                .attachInboundLayer(new DatabridgeLambdaLayer({
                    processInbound: () => {
                        location.reload();
                        return Promise.resolve();
                    }
                }))
        )
        .setOutboundLayer(websocketLayer)
        .finish();

    const pingInterval = setInterval(() => {
        databridge.handleOutboundPacket({type: "PING"});
    }, 10000);

    await databridge.start();

    websocketLayer.socket.addEventListener("close", () => {
        clearInterval(pingInterval);
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
});
