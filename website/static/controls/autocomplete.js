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

function process_autocomplete_results(results){
    var retval = [];
    for (field in results) {
	if (field.indexOf("_suggestions") != -1) {
	    retval = retval.concat(results[field]);
	}
    }
    return retval;
}

function handle_autocomplete_suggestions(results){
    autocomplete_callbacks[results["callback"]](process_autocomplete_results(results));
    delete autocomplete_callbacks[results["callback"]];
}

