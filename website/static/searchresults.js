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
    for (var i = 0; i < agglist.datapairs.length; i++) {
	add_filterresult(facetbox_id, agglist.datapairs[i]);
    }
}

function clear_facetlist(facetbox_id)
{
    var facetbox_div = document.getElementById(facetbox_id + "_facet_container");
    if (!facetbox) return;
    while (facetbox_div.firstChild) {
	facetbox_div.removeChild(facetbox_div.firstChild);
    }
}

function add_filterresult(id, result)
{

    var facetbox_div = document.getElementById(id + "_facet_container");
    if (!facetbox) return;

    var n_div = document.createElement("div");
    n_div.className = "result_row";

    var name_span = document.createElement("span");
    var rght_span = document.createElement("span");
    var rght_text = document.createTextNode("(" + result[1] + ")");
    var name_text = document.createTextNode(result[0]);
    name_span.appendChild(name_text);
    rght_span.className = "pull-right";
    rght_span.appendChild(name_text);
    n_div.appendChild(name_span);
    n_div.appendChild(rght_span);

    facetbox_div.appendChild(n_div);
    
}
