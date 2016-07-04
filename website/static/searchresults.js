function process_histogram_result(control_prefix, result)
{
    var slider = $("#" + control_prefix + "_range_slider");
    var nmax = result["maxvalue"] + searchquery.eso["aggs"][control_prefix]["histogram"]["interval"] - 1;
    var needs_reset = (slider.slider("option", "max") != nmax);
    slider.slider("option", "min", result["minvalue"]);
    slider.slider( "option", "max", nmax);
    if (needs_reset)
    {
	slider.slider("values", [0, slider.slider("option", "max")]);
	document.getElementById(control_prefix + "_textbox").value = "0 - " + slider.slider("option", "max");
    }
    coordinates = document.getElementById(control_prefix + "_textbox").value.split(" - ");
    histogram_div = document.getElementById(control_prefix + "_histogram");
    clear_div_contents(histogram_div);
    return create_histogram(histogram_div, result["buckets"], {"min": result["minvalue"], "max": result["maxvalue"]}, {"min": +coordinates[0], "max": +coordinates[1]}, searchquery.eso["aggs"][control_prefix]["histogram"]["interval"]);
}

function process_agglist(facetbox_id, agglist)
{
    clear_facetlist(facetbox_id);
    if (agglist.datapairs == null) return;
    if (agglist.datapairs.length == 1) agglist.datapairs[0][1] = "x";
    for (var i = 0; i < agglist.datapairs.length; i++) {
	add_filterresult(facetbox_id, agglist.datapairs[i]);
    }
}

function clear_facetlist(facetbox_id)
{
    var facetbox_div = document.getElementById(facetbox_id + "_facet_container");
    if (!facetbox_div) return;
    clear_div_contents(facetbox_div);
}

function clear_div_contents(_div)
{
    if (!_div) return;
    while (_div.firstChild) {
	_div.removeChild(_div.firstChild);
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
    var rght_text;
    if (result[1] == "x")
    {
	n_div.className = "result_row_selected"
	rght_text = document.createElement("img");
	rght_text.src = "/ver4/search/static/x.png";
    }
    else
	rght_text = document.createTextNode(result[1] == -1 ? "" : "(" + result[1] + ")");
    var name_text = document.createTextNode(result[0]);
    name_span.appendChild(name_text);
    rght_span.className = "pull-right";
    rght_span.appendChild(rght_text);
    n_div.appendChild(name_span);
    n_div.appendChild(rght_span);
    n_href.appendChild(n_div);

    facetbox_div.appendChild(n_href);
    
}
