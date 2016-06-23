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
    var rght_text = document.createTextNode("(" + result.doc_count + ")");
    var name_text = document.createTextNode(result.key);
    name_span.appendChild(name_text);
    rght_span.className = "pull-right";
    rght_span.appendChild(name_text);
    n_div.appendChild(name_span);
    n_div.appendChild(rght_span);

    facetbox_div.appendChild(n_div);
    
}
