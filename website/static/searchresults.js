function process_histogram_result(control_prefix, result)
{
    $( "#" + control_prefix + "_range_slider" ).slider( "option", "min", result["minvalue"] );
    $( "#" + control_prefix + "_range_slider" ).slider( "option", "max", result["maxvalue"] + searchquery["aggs"][control_prefix]["histogram"]["interval"] - 1);
    searchquery["aggs"][control_prefix]["histogram"]["interval"] = Math.round((result["maxvalue"] - result["minvalue"]) / 50);
    // draw_histogram(result["datapairs"])
}

function process_agglist(facetbox_id, agglist)
{
    clear_facetlist(facetbox_id);
    if (agglist.datapairs == null) return;
    for (var i = 0; i < agglist.datapairs.length; i++) {
	add_filterresult(facetbox_id, agglist.datapairs[i]);
    }
}

function clear_facetlist(facetbox_id)
{
    var facetbox_div = document.getElementById(facetbox_id + "_facet_container");
    if (!facetbox_div) return;
    while (facetbox_div.firstChild) {
	facetbox_div.removeChild(facetbox_div.firstChild);
    }
}

function call_link_handler(handler, value)
{
    if (facet_link_handlers.hasOwnProperty(handler)) {
	facet_link_handlers[handler](value);
    }
    sendText(JSON.stringify(searchquery.eso));
}

function add_filterresult(id, result)
{

    var facetbox_div = document.getElementById(id + "_facet_container");
    if (!facetbox_div) return;

    var n_href = document.createElement("a");
    var n_div = document.createElement("div");
    n_href.href = "javascript:call_link_handler('" + id + "', '" + result[0] + "');";
    n_div.className = "result_row";

    var name_span = document.createElement("span");
    var rght_span = document.createElement("span");
    var rght_text = document.createTextNode("(" + result[1] + ")");
    var name_text = document.createTextNode(result[0]);
    name_span.appendChild(name_text);
    rght_span.className = "pull-right";
    rght_span.appendChild(rght_text);
    n_div.appendChild(name_span);
    n_div.appendChild(rght_span);
    n_href.appendChild(n_div);

    facetbox_div.appendChild(n_href);
    
}
