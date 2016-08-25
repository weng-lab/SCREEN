function setupCartBrowser(){
    $("#compareInWashU").on('click', function(e){
	e.preventDefault();

	var w = window.location.href;
	var arr = w.split("/");
	var host = arr[0] + "//" + arr[2];

        var trackdbUrl = [host,
                          "washu_trackhub",
                          "trackDb_" + CartGuid + ".json"].join('/')

	console.log(trackdbUrl);

        var urlBase = "http://epigenomegateway.wustl.edu/browser/";
        var assembly = "?genome=" + "hg19";
        var trackhub = "&datahub=" + trackdbUrl;

	var re = results.results.hits[0]._source;
	var d = re["position"];
	var c = d["chrom"] + ':' + d["start"] + '-' + d["end"];
        var coord = "&coordinate=" + c;

        var url = urlBase + assembly + trackhub + coord;

	window.open(url, '_blank');
    });
};
