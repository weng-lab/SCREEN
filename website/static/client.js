var socket = null;
var isopen = false;

var setupSocket = function() {

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

function play(){
    console.log(sendText(JSON.stringify(searchquery.eso)));
    searchquery.set_coordinate_filter("chr1", 1000000, 2000000);
    console.log(sendText(JSON.stringify(searchquery.eso)));
    searchquery.set_cell_line_filter("GM12878");
    console.log(sendText(JSON.stringify(searchquery.eso)));
};

window.onload = function() {
    setupSocket();
};