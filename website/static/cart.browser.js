function setupCartBrowser(){
    $("#compareInWashU").on('click', function(e){
	e.preventDefault();

        var trackdbUrl = ["http://megatux.purcaro.com:9006",
			  "ver4", "search",
                          "washu_trackhub",
                          "trackDb_" + CartGuid + ".json"].join('/')
	
	console.log(trackdbUrl);

        var urlBase = "http://epigenomegateway.wustl.edu/browser/";
        var assembly = "?genome=" + "hg19";
        var trackhub = "&datahub=" + trackdbUrl;

        var url = urlBase + assembly + trackhub;
	
	window.open(url, '_blank');
    });
};
