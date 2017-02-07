var autocomplete_callbacks = {};

function request_suggestions(userQuery, callback_f){
    var ctime = (new Date()).getTime();
    autocomplete_callbacks[ctime] = callback_f;
    var payload = {"action": "suggest",
		   "userQuery": userQuery,
		   "callback": ctime};
    sendText(JSON.stringify(payload));
};

function bind_autocomplete_textbox(textbox_id, f) {
    $("#" + textbox_id).autocomplete({
	source: function (q, response) {
	    f(q.term, response)
	},
	select: function(event, ui) {
	    $("#" + textbox_id).val(ui.item.value);
	    return false;
	},
	change: function() {
	    //$("#" + textbox_id).val("").css("display", 2);
	}
    });
}

function process_autocomplete_results(results){
    //console.log("process_autocomplete_results", "results:", results);
    return results["results"];
}

function handle_autocomplete_suggestions(results){
    var cb = results["callback"];
    console.log(results);
    autocomplete_callbacks[cb](
	process_autocomplete_results(results)
    );
    delete autocomplete_callbacks[cb];
}

