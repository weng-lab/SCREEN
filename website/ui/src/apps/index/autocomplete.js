import ReactDOM from 'react-dom';

class AutoCompleter extends React.Component {
    constructor(props) {
	super(props);
    }

    sendText(s) {
	$.ajax({
            type: "POST",
            url: "/dataws",
            data: s,
            dataType: "json",
            contentType : "application/json",
            success: function(results){
		if("suggestions" == results["type"]){
		    var cb = results["callback"];
		    console.log(results);
		    autocomplete_callbacks[cb](
			results["results"];
		    );
		    delete autocomplete_callbacks[cb];
		}
            },
	    error: function(XMLHttpRequest, textStatus, errorThrown) {
		console.log("Status: " + textStatus);
		console.log("Error: " + errorThrown);
		console.log(XMLHttpRequest);
	    }
	});
    }

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
	    }
	});
    }

    bind_autocomplete_textbox("mainSearchbox", request_suggestions);
}
