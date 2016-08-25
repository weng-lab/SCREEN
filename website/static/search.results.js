function process_histogram_result(control_prefix, result)
{

    if (!(control_prefix in GUI.facets)) {
	console.log(control_prefix + " is not in the facets list");
	return;
    }

    var range_facet = GUI.facets[control_prefix];
    if (!range_facet) {
	console.log(control_prefix + " is in facet list but does not appear to be a range slider");
	return;
    }

    var nmax = result["maxvalue"] + searchquery.eso["aggs"][control_prefix]["histogram"]["interval"] - 1;
    var nrange = [result["minvalue"], nmax];

    // makes empty buckets explicit
    var nbuckets = [];
    var bptr = 0;
    for (var i = result["minvalue"]; i <= result["maxvalue"]; i += searchquery.eso["aggs"][control_prefix]["histogram"]["interval"]) {
	if (result["buckets"][bptr].key == i) {
	    nbuckets.push(result["buckets"][bptr++]);
	    continue;
	}
	nbuckets.push({"key": i, "doc_count": 0});
    }
    result["buckets"] = nbuckets;
    
    if (!_.isEqual(nrange, range_facet.range_slider.get_range())) {
	range_facet.range_slider.set_range(...nrange);
	range_facet.range_slider.refresh_selection(...nrange);
    }

    coordinates = range_facet.range_slider.get_selection_range();
    if (range_facet.histogram)
	range_facet.histogram.reset(result["buckets"], {"min": result["minvalue"], "max": result["maxvalue"]},
				    {"min": +coordinates[0], "max": +coordinates[1]}, searchquery.eso["aggs"][control_prefix]["histogram"]["interval"]);
    else
	range_facet.histogram = create_histogram(document.getElementById(control_prefix + "_histogram"), result["buckets"], {"min": result["minvalue"], "max": result["maxvalue"]},
						 {"min": +coordinates[0], "max": +coordinates[1]}, searchquery.eso["aggs"][control_prefix]["histogram"]["interval"]);

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

function clear_facetlist(facetbox_id){
    var facetbox_div = document.getElementById(facetbox_id + "_facet_container");
    if (!facetbox_div) return;
    clear_div_contents(facetbox_div);
}

function clear_div_contents(_div){
    if (!_div) return;
    while (_div.firstChild) {
	_div.removeChild(_div.firstChild);
    }
}

function call_link_handler(handler, value){
    if (facet_link_handlers.hasOwnProperty(handler)) {
	facet_link_handlers[handler](value);
    }
    perform_search();
}

function add_filterresult(id, result){
    var facetbox_div = document.getElementById(id + "_facet_container");
    if (!facetbox_div) return;

    var n_href = document.createElement("a");
    var n_div = document.createElement("div");
    n_href.href = "javascript:call_link_handler('" + id + "', '" + result[0] + "');";
    n_div.className = "result_row";

    var name_span = document.createElement("span");
    var rght_span = document.createElement("span");
    var rght_text;
    if (result[1] == "x"){
	n_div.className = "result_row_selected"
	rght_text = document.createElement("img");
        var url = "/static/x.png";
	rght_text.src = url;
    } else {
	rght_text = document.createTextNode(result[1] == -1 ? "" : "(" + result[1] + ")");
    }
    
    var name_text = document.createTextNode(result[0]);
    name_span.appendChild(name_text);
    rght_span.className = "pull-right";
    
    if (result[1] == "x"){
	n_href.appendChild(rght_text);
	rght_span.appendChild(n_href);
	n_div.appendChild(name_span);
	n_div.appendChild(rght_span);

	facetbox_div.appendChild(n_div);
    } else {
	rght_span.appendChild(rght_text);
	n_div.appendChild(name_span);
	n_div.appendChild(rght_span);
	n_href.appendChild(n_div);

	facetbox_div.appendChild(n_href);
    }
}
