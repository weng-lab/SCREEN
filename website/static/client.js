var socket = null;
var isopen = false;

var range_preset_handlers = {
    "promoter": function() {
	searchquery.set_promoter_filter_preset();
    },
    "enhancer": function() {
	searchquery.set_enhancer_filter_preset();
    },
    "insulator": function() {
	searchquery.set_insulator_filter_preset();
    }
};

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
    var range_preset = parsed["range_preset"];

    request_cell_lines();
    
    if(ct){
	searchquery.set_cell_line_filter(parsed["cellType"]);
    }
    if(coord){
	searchquery.set_coordinate_filter(coord["chrom"], coord["start"], coord["end"]);
    }
    if (range_preset && range_preset in range_preset_handlers) {
	range_preset_handlers[range_preset]();
    }
    perform_search();
};

window.onload = function() {
    //setupSocket();
};
