function data_request_function(indeces)
{    
    return function (q, response) {
	request_suggestions(q.term, indeces, response); 
    };
}

function select_item_function(textbox_id)
{
    return function(event, ui) {
	$("#" + textbox_id).val(ui.item.value);
	return false;
    };
}

function bind_autocomplete_textbox(textbox_id, indeces_to_search)
{
    $("#" + textbox_id).autocomplete({
	source: data_request_function(indeces_to_search),
	select: select_item_function(textbox_id),
	change: function() {
	    $("#" + textbox_id).val("").css("display", 2);
	}
    });
}
