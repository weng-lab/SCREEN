function facetGUI()
{
    this.facets = {};
}

facetGUI.prototype.refresh = function() {
    for (f in this.facets) {
	var facet = this.facets[f];
	if (facet.id in searchquery.post_filter_map
	    && searchquery.eso.post_filter.bool.must[searchquery.post_filter_map[facet.id]] != {}) {
	    for (field in searchquery.eso.post_filter.bool.must[searchquery.post_filter_map[facet.id]].range) {
		facet.range_slider.set_selection_range(searchquery.eso.post_filter.bool.must[searchquery.post_filter_map[facet.id]].range[field].gte,
						       searchquery.eso.post_filter.bool.must[searchquery.post_filter_map[facet.id]].range[field].lte);
	    }
	}
    }
};

function range_facet()
{
    this.range_slider = null;
    this.histogram = null;
    this.id = null;
}

var GUI = new facetGUI();

function update_coordinate_filter()
{
    var coordinates = GUI.facets["coordinates"].range_slider.get_selection_range();
    searchquery.set_coordinate_filter(searchquery.chromosome, coordinates[0], coordinates[1]);
    perform_search();
}

function update_histogram(range_facet)
{
    var coordinates = range_facet.range_slider.get_selection_range();
    range_facet.histogram.update_selection(...coordinates);
}

function rank_filter_generic(range_facet, fptr)
{
    var ranks = range_facet.range_slider.get_selection_range();
    fptr.call(searchquery, ranks[0], ranks[1]);
    perform_search();
}

function update_dnase_rank_filter() {rank_filter_generic(GUI.facets["dnase"], searchquery.set_dnase_rank_filter);}
function update_ctcf_rank_filter() {rank_filter_generic(GUI.facets["ctcf"], searchquery.set_ctcf_rank_filter);}
function update_promoter_rank_filter() {rank_filter_generic(GUI.facets["promoter"], searchquery.set_promoter_rank_filter);}
function update_enhancer_rank_filter() {rank_filter_generic(GUI.facets["enhancer"], searchquery.set_enhancer_rank_filter);}
function update_conservation_rank_filter() {rank_filter_generic(GUI.facets["conservation"], searchquery.set_conservation_filter);}

function update_dnase_histogram_selection() {update_histogram(GUI.facets["dnase"]);}
function update_ctcf_histogram_selection() {update_histogram(GUI.facets["ctcf"]);}
function update_promoter_histogram_selection() {update_histogram(GUI.facets["promoter"]);}
function update_enhancer_histogram_selection() {update_histogram(GUI.facets["enhancer"]);}
function update_conservation_histogram_selection() {update_histogram(GUI.facets["conservation"]);}
function update_coordinate_histogram_selection() {update_histogram(GUI.facets["coordinates"]);}

GUI.facets["coordinates"] = new range_facet();
GUI.facets["coordinates"].range_slider = create_range_slider("coordinates_range_slider", 2000000, document.getElementById("coordinates_textbox"),
							     update_coordinate_filter, update_coordinate_histogram_selection);

{%- for facet in facetlist -%}
{%- if facet.type == "range" -%}
GUI.facets["{{facet.id}}"] = new range_facet();
GUI.facets["{{facet.id}}"].range_slider = create_range_slider("{{facet.id}}_range_slider", 20000, document.getElementById("{{facet.id}}_textbox"),
							      update_{{facet.id}}_rank_filter, update_{{facet.id}}_histogram_selection);
GUI.facets["{{facet.id}}"].id = "{{facet.id}}";
{%- endif -%}
{%- endfor -%}

{%- for facet in ranklist -%}
GUI.facets["{{facet.id}}"] = new range_facet();
GUI.facets["{{facet.id}}"].range_slider = create_range_slider("{{facet.id}}_range_slider", 20000, document.getElementById("{{facet.id}}_textbox"),
							      update_{{facet.id}}_rank_filter, update_{{facet.id}}_histogram_selection);
GUI.facets["{{facet.id}}"].id = "{{facet.id}}";
{%- endfor -%}

$("#heatmap_dropdown").on("change", function(e) {
    clear_div_contents(document.getElementById("rank_heatmap"));
    create_rank_heatmap(last_results, this.value, enumerations["cell_line"]);
});
