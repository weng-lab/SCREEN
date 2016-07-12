var webSocketUrl = "ws://" + window.location.hostname + ":9000";
var histograms = {};
var enumerations = {};

var last_results = null;

var facet_link_handlers = {
    "chromosome": function(chr) {
	if (searchquery.chromosome != chr)
	{
	    GUI.facets["coordinates"].range_slider.set_range([0, chromosome_lengths[chr]]);
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

function handle_enumeration(results)
{
    enumerations[results["name"]] = results.datapairs;
    process_agglist(results["name"], results);
}

function create_rank_heatmap(results, rank, cell_line_datapairs)
{

    var data = {
	"collabels": [],
	"rowlabels": [],
	"data": []
    };

    var trimmed_rank = rank.split("_")[0];
    var maxes = [];
    var normalization_factor;
    
    defaultlayout.range = [0, 0];
    
    for (var i = 0; i < cell_line_datapairs.length; i++) {
	maxes.push(0);
	data.rowlabels.push(cell_line_datapairs[i][0]);
	for (var j = 0; j < results.results.hits.length; j++) {
	    data.data.push({"col": j + 1,
			    "row": i + 1,
			    "value": results.results.hits[j]._source.ranks[trimmed_rank][cell_line_datapairs[i][0]].rank
			   });
	    if (data.data[data.data.length - 1].value > defaultlayout.range[1])
		defaultlayout.range[1] = data.data[data.data.length - 1].value;
	    if (data.data[data.data.length - 1].value > maxes[i])
		maxes[i] = data.data[data.data.length - 1].value;
	}
    }

    var _max = Math.max(...maxes);
    for (var i = 0; i < cell_line_datapairs.length; i++) {
	normalization_factor = maxes[i] / _max;
	for (var j = 0; j < results.results.hits.length; j++) {
	    data.data[results.results.hits.length * i + j].ovalue = data.data[results.results.hits.length * i + j].value + "/" + maxes[i];
	    data.data[results.results.hits.length * i + j].value /= normalization_factor;
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
    
    toggle_display(document.getElementById("coordinates_facet_panel"), searchquery.has_chromosome_filter());

    if (searchquery.has_cell_line_filter() && document.getElementById("ranks_facet_panel").style.display == "none")
    {
	process_agglist("cell_line", {"name": "cell_line", "datapairs": [[searchquery.cell_line, "x"]]});
    }
    else if (!searchquery.has_cell_line_filter())
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

    GUI.refresh();

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
