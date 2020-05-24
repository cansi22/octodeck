let websocket = null,
    uuid = null,
    
    address = null,
    interval = 60000;

function connectElgatoStreamDeckSocket(inPort, inPropertyInspectorUUID, inRegisterEvent, inInfo, inActionInfo) {
    websocket = new WebSocket('ws://localhost:' + inPort);

    uuid = inPropertyInspectorUUID;

    function registerPlugin(inPropertyInspectorUUID) {
        const json = {
            "event": inRegisterEvent,
            "uuid": inPropertyInspectorUUID
        };
        websocket.send(JSON.stringify(json));
    };

    websocket.onopen = function() {
        registerPlugin(inPropertyInspectorUUID);

        let json = {
            "event": "getGlobalSettings",
            "context": uuid,
        };
        websocket.send(JSON.stringify(json));
    };

    websocket.onmessage = function (evt) {
        // Received message from Stream Deck
        const jsonObj = JSON.parse(evt.data);
        if (jsonObj.event === 'didReceiveGlobalSettings') {
            const payload = jsonObj.payload.settings;
            apikey = payload.apikey;
            address = payload.address;
            interval = payload.interval*1000;
            console.log("gotSettings")
        }
        if (jsonObj.event === "willAppear") {
            console.log("appeared")
            updateTitle(jsonObj.context)
        }
        console.log(jsonObj)
    };

}


async function updateTitle(context) {
    setInterval(async() => {
        if(!address) return;
        const response = await callDuet3D('/rr_status?type=3').then(r => r.json());
        const timeLeft = new Date(response.timesLeft.filament * 1000).toISOString().substr(11, 8);

        let payload = {};
        payload.title = timeLeft.toString();
        payload.target = 0;
        let json = {
            "event": "setTitle",
            "context": context,
            "payload": payload
        };
        websocket.send(JSON.stringify(json));
    }, interval);
}



function callDuet3D(url) {
    return fetch(`${address}${url}`)
}