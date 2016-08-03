var autocomplete_callbacks = {};

function bind_autocomplete_textbox(textbox_id){
    if(0){
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
    } else {
	$("#" + textbox_id).selectize({
	    valueField: 'url',
	    labelField: 'name',
	    searchField: 'name',
	    create: false,
	    load: function(query, callback) {
		if (!query.length){
		    return callback();
		}
		request_suggestions(query.term, callback);
	    }
	});
    }
}

function request_suggestions(userQuery, callback_f){
    var ctime = (new Date()).getTime();
    autocomplete_callbacks[ctime] = callback_f;
    var payload = {"action": "suggest",
		   "userQuery": userQuery,
		   "callback": ctime};
    sendText(JSON.stringify(payload));
};

function process_autocomplete_results(results){
    //console.log("process_autocomplete_results", "results:", results);
    return results["results"];
}

function handle_autocomplete_suggestions(results){
    var cb = results["callback"];
    autocomplete_callbacks[cb](
	process_autocomplete_results(results)
    );
    delete autocomplete_callbacks[cb];
}

