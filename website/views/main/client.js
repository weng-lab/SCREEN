var socket = null;
var isopen = false;

window.onload = function() {

    socket = new WebSocket(webSocketUrl);
    socket.binaryType = "arraybuffer";

    socket.onopen = function() {
        console.log("Connected!");
        isopen = true;
    }

    socket.onmessage = function(e) {
        console.log("Text message received: " + e.data);
    }

    socket.onclose = function(e) {
        console.log("Connection closed.");
        socket = null;
        isopen = false;
    }
};

function sendText(s) {
    if (isopen) {
        socket.send(s);
        console.log("sent " + s);
    } else {
        console.log("Connection not opened.")
    }
};
