var FBVERSION = FBVERSION || (function(){
    // from http://stackoverflow.com/a/2190927

    var _version = {}; // private

    return {
        init : function(version) {
            _version = version;
        },
        ver : function() {
            return _version;
        }
    };
}());

function Ver() {
    return FBVERSION.ver();
}

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

    socket = new WebSocket(WebSocketUrl);
    socket.binaryType = "arraybuffer";

    socket.onopen = function() {
        console.log("Connected to " + WebSocketUrl);
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
