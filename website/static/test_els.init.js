var webSocketUrl = "ws://" + window.location.hostname + ":9000";
var histograms = {};

var facet_link_handlers = {
    "chromosome": function(chr) {
        create_range_slider("coordinates_range_slider", chromosome_lengths[chr], document.getElementById("coordinates_textbox"), update_coordinate_filter);
        searchquery.set_coordinate_filter(chr, 0, chromosome_lengths[chr]);
    }
};

function socket_message_handler(e) {
    //console.log("received " + e.data);
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

    var elements = ["accession", "confidence", "genes", "genome", "position", "ranks"];
    var rtable = $("#searchresults_div");
    var html = "<strong>" + results.results.total + " results</strong><br><br>";
    html += '<table class="table">';

    html += "<thead>";
    $.each(elements, function(i, v) {
        html += "<th>" + v + "</th>";
    });
    html += "</thead>";

    for (var i = 0; i < 10 && i < results.results.total; i++) {
        //console.log(results.results.hits[i]._source);
        var r = results.results.hits[i]._source;
        html += "<tr>";
        $.each(elements, function(i, v) {
            if("genes" == v){
                html += "<td>" + "" + "</td>";
            }else if("ranks" == v){
                html += "<td>" + r["ranks"]["dnase"]["K562"]["rank"] + "</td>";
            }else if("position" == v){
                var p = r["position"]
                html += "<td>" + p["chrom"] + ":" + p["start"] + "-" + p["end"] + "</td>";
            }else {
                html += "<td>" + String(r[v]) + "</td>";
            }
        });
        html += "</tr>";
    }
    rtable.html(html);
}
