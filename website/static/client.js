var socket = null;
var isopen = false;

var setupSocket = function(fonopen) {

    socket = new WebSocket(webSocketUrl);
    socket.binaryType = "arraybuffer";

    socket.onopen = function() {
        console.log("Connected!");
        isopen = true;
        fonopen();
    };

    socket.onmessage = (typeof socket_message_handler === 'function' ? socket_message_handler : function(e) {
        console.log("Text message received: " + e.data);
    });

    socket.onclose = function(e) {
        console.log("Connection closed.");
        socket = null;
        isopen = false;
    };
};

function sendText(s) {
    if (isopen) {
        socket.send(s);
        console.log("sent " + s);
    } else {
        console.log("Connection not opened.")
    }
};

function play(){
    request_cell_lines();
    sendText(JSON.stringify(searchquery.eso));
};

window.onload = function() {
    //setupSocket();
};
