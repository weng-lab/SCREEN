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
	    valueField: 'value',
	    labelField: 'name',
	    searchField: 'name',
	    create: false,
	    options: [],
	    loadThrottle: 0,
	    render: {
		option: function(item, escape) {
		    return '<div><span class=name>' + escape(item.name) + '</span></div>';
		}
	    },
	    load: function(query, callback) {
		if (!query.length){
		    return callback();
		}
		$.ajax({
		    url: '/ver4/search/autocomplete',
		    type: 'POST',
		    contentType: "application/json",
		    dataType: 'json',
		    data: JSON.stringify({"userQuery": query}),
		    error: function() {
			callback();
		    },
		    success: function(res) {
			console.log(res.results);
			callback(res.results);
		    }
		});
	    }
	});
    }
}
