//

function sendText(s) {
    $.ajax({
        type: "POST",
        url: "/ajaxws",
        data: s,
        dataType: "json",
        contentType : "application/json",
        success: function(r){
	    ajaxws_message_handler(r);
        },
	error: function(XMLHttpRequest, textStatus, errorThrown) {
	    console.log("Status: " + textStatus);
	    console.log("Error: " + errorThrown);
	    console.log(XMLHttpRequest);
	}
    });
}

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

function getWidthOfText(txt, fontname, fontsize){
    // http://stackoverflow.com/a/25467363
    var e = document.createElement('span');
    e.style.fontSize = fontsize;
    e.style.fontFamily = fontname;
    e.innerHTML = txt;
    return e.innerWidth;
}