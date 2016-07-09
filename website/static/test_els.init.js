var webSocketUrl = "ws://" + window.location.hostname + ":9000";
var histograms = {};
var enumerations = {};

var last_results = null;

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
    console.log(e.data);
    
    if (results["type"] == "enumeration")
	handle_enumeration(results);
    else if (results["type"] == "query_results")
	handle_query_results(results);
    else if (results["type"] == "suggestions")
	handle_autocomplete_suggestions(results);

}

function handle_autocomplete_suggestions(results)
{
    // TODO: handle suggestions
}

function handle_enumeration(results)
{
    enumerations[results["name"]] = results.datapairs;
    process_agglist(results["name"], results);
}

function reset_range_slider(div_id, max, textbox_el, stopf, slidef, selection_range=null)
{
    clear_div_contents(document.getElementById(div_id));
    create_range_slider(div_id, max, textbox_el, stopf, slidef, selection_range);
    if (selection_range != null) textbox_el.value = selection_range[0] + " - " + selection_range[1];
}

function reset_rank_sliders(agg_results)
{
    reset_range_slider("dnase_rank_range_slider", 20000, document.getElementById("dnase_rank_textbox"), update_dnase_rank_filter, update_dnase_histogram_selection);
    reset_range_slider("ctcf_rank_range_slider", 20000, document.getElementById("ctcf_rank_textbox"), update_ctcf_rank_filter, update_ctcf_histogram_selection);
    reset_range_slider("promoter_rank_range_slider", 20000, document.getElementById("promoter_rank_textbox"), update_promoter_rank_filter, update_promoter_histogram_selection);
    reset_range_slider("enhancer_rank_range_slider", 20000, document.getElementById("enhancer_rank_textbox"), update_enhancer_rank_filter, update_enhancer_histogram_selection);
    reset_range_slider("conservation_range_slider", 20000, document.getElementById("conservation_textbox"), update_conservation_filter, update_conservation_histogram_selection);
}

function create_rank_heatmap(results, rank, cell_line_datapairs)
{

    var data = {
	"collabels": [],
	"rowlabels": [],
	"data": []
    };

    var trimmed_rank = rank.split("_")[0];
    
    defaultlayout.range = [0, 0];
    
    for (var i = 0; i < cell_line_datapairs.length; i++) {
	data.rowlabels.push(cell_line_datapairs[i][0]);
	for (var j = 0; j < results.results.hits.length; j++) {
	    data.data.push({"col": j + 1,
			    "row": i + 1,
			    "value": results.results.hits[j]._source.ranks[trimmed_rank][cell_line_datapairs[i][0]].rank
			   });
	    if (data.data[data.data.length - 1].value > defaultlayout.range[1])
		defaultlayout.range[1] = data.data[data.data.length - 1].value;
	}
    }

    for (i in results.results.hits) {
	data.collabels.push(results.results.hits[i]._source.accession);
    }

    create_heatmap(data, "rank_heatmap", defaultlayout);
    
}

function handle_query_results(results)
{

    last_results = results;
    
    if (searchquery.has_chromosome_filter() && document.getElementById("coordinates_facet_panel").style.display == "none")
    {
        reset_range_slider("coordinates_range_slider",
                           2000000,
                           document.getElementById("coordinates_textbox"),
                           update_coordinate_filter,
                           update_coordinate_histogram_selection,
			   searchquery.get_coordinate_selection_range());
    }
    toggle_display(document.getElementById("coordinates_facet_panel"), searchquery.has_chromosome_filter());

    if (searchquery.has_cell_line_filter() && document.getElementById("ranks_facet_panel").style.display == "none")
    {
	reset_rank_sliders();
	process_agglist("cell_line", {"name": "cell_line", "datapairs": [[searchquery.cell_line, "x"]]});
    }
    else
    {
	clear_div_contents(document.getElementById("rank_heatmap"));
	create_rank_heatmap(results, document.getElementById("heatmap_dropdown").value, enumerations["cell_line"]);
    }

    toggle_display(document.getElementById("ranks_facet_panel"), searchquery.has_cell_line_filter());
    toggle_display(document.getElementById("heatmap_container"), !searchquery.has_cell_line_filter());

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
        "language": {
            "thousands": ","
        },
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
	"order": [[ 1, "desc" ],
		  [3, "asc"],
		  [4, "asc"]
		 ]
    } );

}
