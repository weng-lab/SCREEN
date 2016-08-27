var enumerations = {};

var last_results = null;

var venn_results = {"overlaps": [{"sets": [0, 1], "size": -1}],
		    "sets": [{"size": -1}, {"size": -1}]};

var re_table = new RE_table();

function updateSearchBar(){
    var assembly = searchquery.assembly;
    var cellType = searchquery.cell_line;
    var chrom = searchquery.chromosome;
    var start = searchquery.chromosome_start;
    var end = searchquery.chromosome_end;

    var pos = ""
    if(chrom > ""){
	pos = chrom + ':' + start + '-' + end;
    }
    
    var arr = [assembly, cellType, pos];
    var str = arr.filter(function(e){ return e > ""; }).join(' ');
    $('#queryBox').val(str);
};

var facet_link_handlers = {
    "chromosome": function(chr) {
	if (searchquery.chromosome != chr){
	    GUI.facets["coordinates"].range_slider.set_range([0, chromosome_lengths[chr]]);
            searchquery.set_coordinate_filter(chr, 0, chromosome_lengths[chr]);
	} else {
	    searchquery.set_coordinate_filter("", 0, 0);
        }
	updateSearchBar();
    },
    "cell_line": function(cell_line) {
	searchquery.set_cell_line_filter(cell_line);
	if (searchquery.cell_line == ""){
	    request_cell_lines();
        } else {
	    process_agglist("cell_line",
			    {"name": "cell_line",
			     "datapairs": [[cell_line, "x"]]});
        }
	updateSearchBar();
	perform_search();
    }
};

var query_results_handlers = {
    "regulatory_elements": handle_regulatory_results,
    "expression_matrix": handle_expression_matrix_results,
    "venn_handler_both": venn_handler_both,
    "venn_handler_left": venn_handler_left,
    "venn_handler_right": venn_handler_right
};

function create_venn(){
    clear_div_contents(document.getElementById("venn_div"));
    if (venn_results.sets[0].size == 0 && venn_results.sets[1].size == 0) {
	document.getElementById("venn_div").appendChild(document.createTextNode("No data; select a higher threshold rank."));
	return;
    }
    var nrange = GUI.facets[document.getElementById("vennrank_dropdown").value].range_slider.get_range();
    if (!_.isEqual(venn_lbound_slider.get_range(), nrange)) {
        venn_lbound_slider.set_range(...nrange);
    }
    create_venn_diagram("venn_div", venn_results);
}

function toggle_display(el, sh){
    el.style.display = (sh ? "block" : "none");
}

function ajaxws_message_handler(e) {
    results = e;

    //console.log(results);
    
    if ("enumeration" == results["type"]) {
        // console.log(e.data);

	handle_enumeration(results);

	if ("cell_line" == results["name"]) {
	    var select = document.getElementById("cell_line_dropdown");
	    for (i in enumerations["cell_line"]) {
		var option = document.createElement("option");
		option.value = enumerations["cell_line"][i][0];
		option.text = enumerations["cell_line"][i][0];
		select.add(option);
	    }
	}
    } else if("suggestions" == results["type"]) {
	handle_autocomplete_suggestions(results);
    } else if("query_results" == results["type"] || "callback" in results){
	if (results["callback"] in query_results_handlers){
            query_results_handlers[results["callback"]](results);
        }
    } else if("re_details" == results["type"]) {
	handle_details(results);
    } else if ("peak_details" == results["type"]) {
	handle_peaks(results);
    } else {
        console.log("unhandled result type:", results["type"]);
    }

    updateSearchBar();
}

function handle_details(results) {
    regelm_details_view.snp_view.load_list(results.overlapping_snps, 5);
    regelm_details_view.genes_view.load_list(results.nearby_genes, 5);
    regelm_details_view.re_view.load_list(results.nearby_res, 5);
    request_peaks(results.q);
}

function handle_peaks(results) {
    regelm_details_view.peak_overlap_view.load_data(results.peak_results.other, 5);
    regelm_details_view.tf_view.load_data(results.peak_results.tfs, 5);
    regelm_details_view.histones_view.load_data(results.peak_results.histones, 5);
}

function venn_ready(){
    if (venn_results.overlaps[0].size == -1) return false;
    if (venn_results.sets[0].size == -1) return false;
    if (venn_results.sets[1].size == -1) return false;
    return true;
}

function reset_venn_results(cell_line_labels){
    venn_results.overlaps[0].size = -1;
    venn_results.sets[0].size = -1;
    venn_results.sets[1].size = -1;
    venn_results.sets[0].label = cell_line_labels[0];
    venn_results.sets[1].label = cell_line_labels[1];
}

function venn_handler_both(results){
    venn_results.overlaps[0].size = results.hits.total;
    if (venn_ready()) create_venn();
}

function venn_handler_left(results){
    venn_results.sets[0].size = results.hits.total;
    if (venn_ready()) create_venn();
}

function venn_handler_right(results){
    venn_results.sets[1].size = results.hits.total;
    if (venn_ready()) create_venn();
}

function handle_enumeration(results){
    enumerations[results["name"]] = results.datapairs;
    process_agglist(results["name"], results);
}

function refresh_venn(){
    var cl = document.getElementById("cell_line_dropdown").value;
    reset_venn_results([searchquery.cell_line, cl]);
    request_venn(get_venn_queries([searchquery.cell_line, cl], document.getElementById("vennrank_dropdown").value));
}

function create_expression_heatmap(results){
    var data = {
	"collabels": [],
	"rowlabels": [],
	"data": []
    };
    var result, eset;
    var map = {};
    var datamap = {};

    defaultlayout.range = [0, 0];
    defaultlayout.colors = ['#FFFFFF','#F1EEF6','#E6D3E1','#DBB9CD','#D19EB9','#C684A4','#BB6990','#B14F7C','#A63467','#9B1A53','#91003F'];
    defaultlayout.margin.top = 200;
    defaultlayout.margin.left = 600;
    
    for (i in results.hits) {
	result = results.hits[i]._source;
	data.collabels.push(result.ensembl_id);
	for (n in result.expression_values) {
	    eset = result.expression_values[n];
	    if (!(eset.dataset in map)) {
		for (key in eset) {
		    if (key.indexOf("rep1_tpm") != -1) {
			var rl = eset.cell_line + " (" + eset.dataset + ", " + key.split("_")[0] + ")";
			if (!(rl in map)) {
			    data.rowlabels.push(rl);
			    datamap[data.rowlabels.length - 1] = {}
			    map[rl] = data.rowlabels.length - 1;
			}
			var v1 = Math.log(eset[key]);
			datamap[map[rl]][data.collabels.length - 1] = v1;
			if (v1 > defaultlayout.range[1]) defaultlayout.range[1] = v1;
		    }
		}
	    }
	}
    }

    defaultlayout.legend_labels = ["1", "", "", "", "", "", "", "", "", defaultlayout.range[1]];

    for (i = 0; i < data.rowlabels.length; i++) {
	for (j = 0; j < data.collabels.length; j++) {
	    if (j in datamap[i]){
		data.data.push({"row": i + 1,
				"col": j + 1,
				"value": datamap[i][j]});
            } else {
		data.data.push({"row": i + 1,
				"col": j + 1,
				"value": 0});
            }
	}
    }

    create_heatmap(data, "expression_heatmap", defaultlayout);
}

function create_rank_heatmap(results, rank, cell_line_datapairs){
    showTab("tab_rank_heatmap");
    
    var data = {
	"collabels": [],
	"rowlabels": [],
	"data": []
    };

    var trimmed_rank = rank.split("_")[0];
    var maxes = [];
    var normalization_factor;

    defaultlayout.range = [0, 0];
    defaultlayout.colors = ['#FFFFFF','#F1EEF6','#E6D3E1','#DBB9CD','#D19EB9','#C684A4','#BB6990','#B14F7C','#A63467','#9B1A53','#91003F'].reverse();
    defaultlayout.legend_labels = ["1", "", "", "", "", "", "", "", "", "max"];
    defaultlayout.margin.top = 100;
    defaultlayout.margin.left = 75;

    for (var i = 0; i < cell_line_datapairs.length; i++) {
	maxes.push(0);
	data.rowlabels.push(cell_line_datapairs[i][0]);
	for (var j = 0; j < results.results.hits.length; j++) {
	    data.data.push({"col": j + 1,
			    "row": i + 1,
			    "value": results.results.hits[j]._source.ranks[trimmed_rank][cell_line_datapairs[i][0]].rank
			   });
	    if (data.data[data.data.length - 1].value > defaultlayout.range[1]){
		defaultlayout.range[1] = data.data[data.data.length - 1].value;
            }
	    if (data.data[data.data.length - 1].value > maxes[i]){
		maxes[i] = data.data[data.data.length - 1].value;
            }
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

function handle_expression_matrix_results(results){
    clear_div_contents(document.getElementById("expression_heatmap"));
    create_expression_heatmap(results.results);
}

function handle_regulatory_results(results){

    var needs_requery = false;
    
    if(re_table.callback){
	re_table.runCallback();
	return;
    }

    last_results = results;

    toggle_display(document.getElementById("coordinates_facet_panel"),
		   searchquery.has_chromosome_filter());

    if (searchquery.has_cell_line_filter() &&
        document.getElementById("ranks_facet_panel").style.display == "none"){
	process_agglist("cell_line",
			{"name": "cell_line",
			 "datapairs": [[searchquery.cell_line, "x"]]});
    } else if (!searchquery.has_cell_line_filter()) {
	clear_div_contents(document.getElementById("rank_heatmap"));
	create_rank_heatmap(results,
			    document.getElementById("heatmap_dropdown").value,
			    enumerations["cell_line"]);
    }

    toggle_display(document.getElementById("ranks_facet_panel"),
		   searchquery.has_cell_line_filter());
    toggle_display(document.getElementById("heatmap_container"),
		   !searchquery.has_cell_line_filter());

    for (aggname in results["aggs"]) {
        if (results["aggs"][aggname]["type"] == "list") {
            process_agglist(aggname, results["aggs"][aggname]);
        } else if (results["aggs"][aggname]["type"] == "histogram") {
	    if (!process_histogram_result(aggname, results["aggs"][aggname])) {
		needs_requery = true;
	    }
        }
    }

    if (needs_requery) perform_search();
    GUI.refresh();

    re_table.renderTable();

    var genelist = [];
    for (i in results.results.hits) {
	var result = results.results.hits[i]._source;
	genelist.push(result.genes["nearest-pc"]["gene-id"]);
	genelist.push(result.genes["nearest-all"]["gene-id"]);
    }
    perform_gene_expression_search(gene_expression_query(genelist));

    if (searchquery.has_cell_line_filter()){
	for (i in enumerations["cell_line"]) {
	    if (enumerations["cell_line"][i] != searchquery.cell_line) {
		break;
	    }
	}
    }
}
