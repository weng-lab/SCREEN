var searchquery = new Query();

function perform_search(){
    sendText(JSON.stringify({"action": "query",
			     "callback": "regulatory_elements",
			     "index": "regulatory_elements",
			     "object": searchquery.eso}));
};

function facetGUI(){
    this.facets = {};
}

facetGUI.prototype.resize = function() {
    for (f in this.facets) {
	var facet = this.facets[f];
	if (facet.id in searchquery.post_filter_map
	    && searchquery.eso.post_filter.bool.must[searchquery.post_filter_map[facet.id]] != {}) {
	    for (field in searchquery.eso.post_filter.bool.must[searchquery.post_filter_map[facet.id]].range) {
		if (!facet.range_slider || !facet.histogram) {
		    continue;
		}
		facet.histogram.redraw();
	    }
	}
    }
    perform_search();
}

facetGUI.prototype.refresh = function() {
    for (f in this.facets) {
	var facet = this.facets[f];
	if (facet.id in searchquery.post_filter_map
	    && searchquery.eso.post_filter.bool.must[searchquery.post_filter_map[facet.id]] != {}) {
	    for (field in searchquery.eso.post_filter.bool.must[searchquery.post_filter_map[facet.id]].range) {
		if (!facet.range_slider || !facet.histogram) {
		    continue;
		}
		facet.range_slider.refresh_selection(searchquery.eso.post_filter.bool.must[searchquery.post_filter_map[facet.id]].range[field].gte,
						     searchquery.eso.post_filter.bool.must[searchquery.post_filter_map[facet.id]].range[field].lte);
		facet.histogram.update_selection(...facet.range_slider.get_selection_range());
	    }
	}
    }
    if (searchquery.get_coordinate_selection_range()) {
	this.facets["coordinates"].range_slider.refresh_selection(...searchquery.get_coordinate_selection_range());
	this.facets["coordinates"].histogram.update_selection(...searchquery.get_coordinate_selection_range());
    }
};

function range_facet(){
    this.range_slider = null;
    this.histogram = null;
    this.id = null;
}

function update_coordinate_filter(){
    var coordinates = GUI.facets["coordinates"].range_slider.get_selection_range();
    searchquery.set_coordinate_filter(searchquery.chromosome, coordinates[0], coordinates[1]);
    perform_search();
}

function update_histogram(range_facet){
    var coordinates = range_facet.range_slider.get_selection_range();
    range_facet.histogram.update_selection(...coordinates);
}

function rank_filter_generic(range_facet, fptr){
    var ranks = range_facet.range_slider.get_selection_range();
    fptr.call(searchquery, ranks[0], ranks[1]);
    perform_search();
}

var update_rank_filter = {
    dnase : function() {
        rank_filter_generic(GUI.facets["dnase"],
                            searchquery.set_dnase_rank_filter);
    },
    ctcf : function() {
        rank_filter_generic(GUI.facets["ctcf"],
                            searchquery.set_ctcf_rank_filter);
    },
    promoter : function() {
        rank_filter_generic(GUI.facets["promoter"],
                            searchquery.set_promoter_rank_filter);
    },
    enhancer : function() {
        rank_filter_generic(GUI.facets["enhancer"],
                            searchquery.set_enhancer_rank_filter);
    },
    conservation : function() {
        rank_filter_generic(GUI.facets["conservation"],
                            searchquery.set_conservation_filter);
    }
};

var update_tss_filter = {
    pc: function() {
	searchquery.set_pcgene_filter(...GUI.facets["pc"].range_slider.get_selection_range());
	perform_search();
    },
    all: function() {
	searchquery.set_allgene_filter(...GUI.facets["all"].range_slider.get_selection_range());
	perform_search();
    }
};

var update_histogram_selection = {
    dnase : function() { update_histogram(GUI.facets["dnase"]); },
    ctcf : function() { update_histogram(GUI.facets["ctcf"]); },
    promoter : function() { update_histogram(GUI.facets["promoter"]); },
    enhancer : function() { update_histogram(GUI.facets["enhancer"]); },
    conservation : function() { update_histogram(GUI.facets["conservation"]); },
    coordinate : function() { update_histogram(GUI.facets["coordinates"]); },
    pc: function() {update_histogram(GUI.facets["pc"]);},
    all: function() {update_histogram(GUI.facets["all"]);}
};

function checklist_facet()
{
    
    this.tfs = [];
    this.input_box = null;
    this.check_div = null;

    this.add_tf = function(tf) {

	if (tf in this.tfs) return;
	this.tfs.push({"id": tf, "selected": true});
	var tid = this.tfs.length - 1;
	
	var nc = document.createElement("input");
	nc.type = "checkbox";
	nc.checked = true;
	nc.value = tf;
	nc.onclick = function() {
	    this.tfs[tid].selected = nc.checked;
	};

	var nt = document.createTextNode(" " + tf);
	this.check_div.appendChild(nc);
	this.check_div.appendChild(nt);
	this.check_div.appendChild(document.createElement("br"));
	
    };
    
}

var GUI = new facetGUI();

GUI.facets["coordinates"] = new range_facet();
GUI.facets["coordinates"].range_slider =
    create_range_slider("coordinates_range_slider",
                        2000000000,
                        document.getElementById("coordinates_textbox"),
			update_coordinate_filter,
                        update_histogram_selection["coordinate"]);

$.each(FacetList, function(idx, facet) {
    if("range" == facet.type){
        GUI.facets[facet.id] = new range_facet();
        GUI.facets[facet.id].range_slider =
            create_range_slider(facet.id + "_range_slider",
                                2000000,
                                document.getElementById(facet.id + "_textbox"),
				update_rank_filter[facet.id],
                                update_histogram_selection[facet.id]);
        GUI.facets[facet.id].id = facet.id
    } else if ("checklist" == facet.type) {
	GUI.facets[facet.id] = new checklist_facet();
	GUI.facets[facet.id].id = facet.id;
	GUI.facets[facet.id].input_box = document.getElementById(facet.id + "_cl_input");
	$("#" + facet.id + "_cl_input").keyup(function(e) {
	    if (e.keyCode == 13) { // enter key
		GUI.facets[facet.id].add_tf(GUI.facets[facet.id].input_box.value);
		GUI.facets[facet.id].input_box.value = "";
	    }
	});
	GUI.facets[facet.id].check_div = document.getElementById(facet.id + "_list_container");
    }
});

$.each(TSS_List, function(idx, facet) {
    GUI.facets[facet.id] = new range_facet();
    GUI.facets[facet.id].range_slider =
        create_range_slider(facet.id + "_range_slider",
                            2000000,
                            document.getElementById(facet.id + "_textbox"),
			    update_tss_filter[facet.id],
                            update_histogram_selection[facet.id]);
    GUI.facets[facet.id].id = facet.id;
});

$.each(RankList, function(idx, facet) {
    GUI.facets[facet.id] = new range_facet();
    GUI.facets[facet.id].range_slider =
        create_range_slider(facet.id + "_range_slider",
                            2000000,
                            document.getElementById(facet.id + "_textbox"),
			    update_rank_filter[facet.id],
                            update_histogram_selection[facet.id]);
    GUI.facets[facet.id].id = facet.id;
});

venn_lbound_slider = create_slider("venn_lbound_slider",
				   100000,
				   document.getElementById("venn_lbound_textbox"),
				   refresh_venn,
				   null);

$("#heatmap_dropdown").on("change", function(e) {
    clear_div_contents(document.getElementById("rank_heatmap"));
    create_rank_heatmap(last_results, this.value, enumerations["cell_line"]);
});

var range_preset_handlers = {
    "promoter": function() {
	searchquery.set_promoter_filter_preset();
    },
    "enhancer": function() {
	searchquery.set_enhancer_filter_preset();
    },
    "insulator": function() {
	searchquery.set_insulator_filter_preset();
    }
};

function play(parsed){
    var ct = parsed["cellType"];
    var coord = parsed["coord"];
    var range_preset = parsed["range_preset"];

    request_cell_lines();

    if(ct){
	searchquery.set_cell_line_filter(parsed["cellType"]);
    }
    if(coord){
	searchquery.set_coordinate_filter(coord["chrom"], coord["start"], coord["end"]);
    }
    if (range_preset && range_preset in range_preset_handlers) {
	range_preset_handlers[range_preset]();
    }
    perform_search();
};

$(window).resize(GUI.resize);
