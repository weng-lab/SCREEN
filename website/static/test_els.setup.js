function update_coordinate_filter()
{
    var coordinates = document.getElementById("coordinates_textbox").value.split(" - ");
    searchquery.set_coordinate_filter(searchquery.chromosome, coordinates[0], coordinates[1]);
    perform_search();
}

function update_histogram(histogram, id)
{
    var coordinates = document.getElementById(id + "_textbox").value.split(" - ");
    update_histogram_selection(histogram, {"min": coordinates[0], "max": coordinates[1]});
}

function rank_filter_generic(id, fptr)
{
    var ranks = document.getElementById(id).value.split(" - ");
    fptr.call(searchquery, ranks[0], ranks[1]);
    perform_search();
}

function update_dnase_rank_filter() {rank_filter_generic("dnase_rank_textbox", searchquery.set_dnase_rank_filter);}
function update_ctcf_rank_filter() {rank_filter_generic("ctcf_rank_textbox", searchquery.set_ctcf_rank_filter);}
function update_promoter_rank_filter() {rank_filter_generic("promoter_rank_textbox", searchquery.set_promoter_rank_filter);}
function update_enhancer_rank_filter() {rank_filter_generic("enhancer_rank_textbox", searchquery.set_enhancer_rank_filter);}
function update_conservation_filter() {rank_filter_generic("conservation_textbox", searchquery.set_conservation_filter);}

function update_dnase_histogram_selection() {update_histogram(histograms["dnase_rank"], "dnase_rank");}
function update_ctcf_histogram_selection() {update_histogram(histograms["ctcf_rank"], "ctcf_rank");}
function update_promoter_histogram_selection() {update_histogram(histograms["promoter_rank"], "promoter_rank");}
function update_enhancer_histogram_selection() {update_histogram(histograms["enhancer_rank"], "enhancer_rank");}
function update_conservation_histogram_selection() {update_histogram(histograms["conservation"], "conservation");}
function update_coordinate_histogram_selection() {update_histogram(histograms["coordinates"], "coordinates");}

create_range_slider("coordinates_range_slider", 2000000, document.getElementById("coordinates_textbox"), update_coordinate_filter, update_coordinate_histogram_selection);

$("#heatmap_dropdown").on("change", function(e) {
    create_rank_heatmap(this.value);
});
