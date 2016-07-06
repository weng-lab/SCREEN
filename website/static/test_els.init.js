var webSocketUrl = "ws://" + window.location.hostname + ":9000";
var histograms = {};

var facet_link_handlers = {
    "chromosome": function(chr) {
	if (searchquery.chromosome != chr)
	{
            create_range_slider("coordinates_range_slider",
				chromosome_lengths[chr],
				document.getElementById("coordinates_textbox"),
				update_coordinate_filter,
				update_coordinate_histogram_selection);
            searchquery.set_coordinate_filter(chr, 0, chromosome_lengths[chr]);
	}
	else
	    searchquery.set_coordinate_filter("", 0, 0);
    },
    "cell_line": function(cell_line) {
	searchquery.set_cell_line_filter(cell_line);
	if (searchquery.cell_line == "")
	    request_cell_lines();
	else
	    process_agglist("cell_line", {"name": "cell_line", "datapairs": [[cell_line, "x"]]});
	perform_search();
    }
};

function toggle_display(el, sh)
{
    el.style.display = (sh ? "block" : "none");
}

function socket_message_handler(e) {

    results = JSON.parse(e.data);

    if (results["type"] == "enumeration")
	handle_enumeration(results);
    else if (results["type"] == "query_results")
	handle_query_results(results);

}

function handle_enumeration(results)
{
    process_agglist(results["name"], results);
}

function reset_range_slider(div_id, max, textbox_el, stopf, slidef)
{
    clear_div_contents(document.getElementById(div_id));
    create_range_slider(div_id, max, textbox_el, stopf, slidef);
}

function reset_rank_sliders(agg_results)
{
    reset_range_slider("dnase_rank_range_slider", 20000, document.getElementById("dnase_rank_textbox"), update_dnase_rank_filter, update_dnase_histogram_selection);
    reset_range_slider("ctcf_rank_range_slider", 20000, document.getElementById("ctcf_rank_textbox"), update_ctcf_rank_filter, update_ctcf_histogram_selection);
    reset_range_slider("promoter_rank_range_slider", 20000, document.getElementById("promoter_rank_textbox"), update_promoter_rank_filter, update_promoter_histogram_selection);
    reset_range_slider("enhancer_rank_range_slider", 20000, document.getElementById("enhancer_rank_textbox"), update_enhancer_rank_filter, update_enhancer_histogram_selection);
    reset_range_slider("conservation_range_slider", 20000, document.getElementById("conservation_textbox"), update_conservation_filter, update_conservation_histogram_selection);
}

function handle_query_results(results)
{

    toggle_display(document.getElementById("coordinates_facet_panel"), searchquery.has_chromosome_filter());
    
    if (searchquery.has_chromosome_filter() && document.getElementById("coordinates_facet_panel").style.display == "none")
    {
        reset_range_slider("coordinates_range_slider",
                           2000000,
                           document.getElementById("coordinates_textbox"),
                           update_coordinate_filter,
                           update_coordinate_histogram_selection);
	document.getElementById("coordinates_facet_panel").style.display = "block";
    }

    if (searchquery.has_cell_line_filter() && document.getElementById("ranks_facet_panel").style.display == "none")
	reset_rank_sliders();
    toggle_display(document.getElementById("ranks_facet_panel"), searchquery.has_cell_line_filter());

    for (aggname in results["aggs"]) {
        if (results["aggs"][aggname]["type"] == "list") {
            process_agglist(aggname, results["aggs"][aggname]);
        } else if (results["aggs"][aggname]["type"] == "histogram") {
            histograms[aggname] = process_histogram_result(aggname, results["aggs"][aggname]);
        }
    }

    var rtable = $("#searchresults_table");
    rtable.DataTable( {
	destroy: true,
        "processing": true,
        "data": results.results.hits,
        "columns": [
	    { "data": "_source.accession" },
	    { "data": "_source.confidence" },
	    { "data": "_source.genome" },
            { "data": "_source.position.chrom" },
	    { "data": "_source.position.start" },
	    { "data": "_source.position.end" }
        ],
	"order": [[ 1, "desc" ]]
    } );
    
}
