//

function sendText(s) {
    var data = JSON.stringify(s);

    $.ajax({
        type: "POST",
        url: "/ajaxws",
        data: data,
        dataType: "json",
        contentType : "application/json",
        success: function(r){
	    ajaxws_message_handler(r);
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
