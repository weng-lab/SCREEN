var socket = null;
var isopen = false;

var setupSocket = function(fonopen, fargs) {

    socket = new WebSocket(webSocketUrl);
    socket.binaryType = "arraybuffer";

    socket.onopen = function() {
        console.log("Connected to " + webSocketUrl);
        isopen = true;
        fonopen(fargs);
    };

    socket.onmessage = function(e){
        console.log("Text message received");
	if(typeof socket_message_handler === 'function'){
	    socket_message_handler(e);
	} else {
            console.log(e.data);
	}
    };

    socket.onclose = function(e) {
        console.log("Connection closed.");
        socket = null;
        isopen = false;
    };
};

function sendText(s) {
    if (isopen) {
        socket.send(s);
        console.log("sent:");
	console.log(s);
    } else {
        console.log("Connection not opened.")
    }
};

function play(parsed){
    console.log(parsed);
    var ct = parsed["cellType"];
    var coord = parsed["coord"];

    if(ct){
	searchquery.set_cell_line_filter(parsed["cellType"]);
    }
    if(coord){
	searchquery.set_coordinate_filter(coord["chrom"], coord["start"], coord["end"]);
    }
    if(!ct && !coord){
	console.log("everything");
	request_cell_lines();
    }
    sendText(JSON.stringify(searchquery.eso));
};

window.onload = function() {
    //setupSocket();
};
