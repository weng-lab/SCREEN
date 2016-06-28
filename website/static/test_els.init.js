var webSocketUrl = "ws://" + window.location.hostname + ":9000";
var histograms = {};

var facet_link_handlers = {
    "chromosome": function(chr) {
        create_range_slider("coordinates_range_slider", chromosome_lengths[chr], document.getElementById("coordinates_textbox"), update_coordinate_filter);
        searchquery.set_coordinate_filter(chr, 0, chromosome_lengths[chr]);
    }
};

function socket_message_handler(e) {
    console.log("received " + e.data);
    results = JSON.parse(e.data);
    if (searchquery.has_chromosome_filter() && document.getElementById("coordinates_facet_panel").style.display == "none")
    {
        document.getElementById("coordinates_facet_panel").style.display = "block";
        clear_div_contents(document.getElementById("coordinates_range_slider"));
        create_range_slider("coordinates_range_slider", 2000000, document.getElementById("coordinates_textbox"), update_coordinate_filter, update_coordinate_histogram_selection);
    }
    for (aggname in results["aggs"]) {
        if (results["aggs"][aggname]["type"] == "list") {
            process_agglist(aggname, results["aggs"][aggname]);
        } else if (results["aggs"][aggname]["type"] == "histogram") {
            histograms[aggname] = process_histogram_result(aggname, results["aggs"][aggname]);
        }
    }
    document.getElementById("searchresults_div").innerHTML = "<strong>" + results.results.total + " results</strong><br><br>";
    for (var i = 0; i < 10 && i < results.results.total; i++) {
        document.getElementById("searchresults_div").innerHTML += results.results.hits[i]._source.accession + "<br>";
    }
}
