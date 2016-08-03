function bind_autocomplete_textbox(textbox_id){
    $("#" + textbox_id).autocomplete({
	source: function (q, response) {
	    request_suggestions(q.term, response)
	},
	select: function(event, ui) {
	    $("#" + textbox_id).val(ui.item.value);
	    return false;
	},
	change: function() {
	    $("#" + textbox_id).val("").css("display", 2);
	}
    });
}
