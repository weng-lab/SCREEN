var autocomplete_callbacks = {};

function bind_autocomplete_textbox(textbox_id){
    $("#" + textbox_id).selectize({
	valueField: 'value',
	labelField: 'name',
	searchField: 'name',
	selectOnTab: true,
	create: false,
	options: [],
	loadThrottle: 300,
	maxItems : null,
	delimiter: ',',
	render: {
	    option: function(item, escape) {
		console.log("item");
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
