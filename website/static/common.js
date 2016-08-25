var socket = null;
var isopen = false;

function setupSocket(fonopen, fargs) {
    if (typeof(fonopen)==='undefined') fonopen = null;
    if (typeof(fargs)==='undefined') fargs = null;
    
    socket = new WebSocket(WebSocketUrl);
    socket.binaryType = "arraybuffer";

    socket.onopen = function() {
        console.log("Connected to " + WebSocketUrl);
        isopen = true;
        if(fonopen){
            fonopen(fargs);
        }
    };

    socket.onmessage = function(e){
        //console.log("Text message received");
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
        //console.log("sent:");
	//console.log(s);
    } else {
        console.log("Connection not opened.")
    }
};

function growPerm(div){
    $(div).hover(function() {
	hoverTimeout = setTimeout(function() {
	    $(div).removeClass('grow');
	}, 200);
    }, function() {
	clearTimeout(hoverTimeout);
    });
};

function showTab(tabName){
    // http://stackoverflow.com/a/11744586
    var tab = $('.nav-tabs a[href="#' + tabName + '"]');
    
    tab.click(function(e){
	e.preventDefault();
	tab.tab('show');
    });
    tab.show();           
    tab.tab('show');
}
