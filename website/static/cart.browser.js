function setupCartBrowser(){
    $("#compareInWashU").on('click', function(e){
	e.preventDefault();

        var trackdbUrl = ["http://megatux.purcaro.com:9006",
                          "trackhub_washu",
                          "trackDb_" + CartGuid + ".json"].join('/')
	
        var urlBase = "http://epigenomegateway.wustl.edu/browser/";
        var assembly = "?genome=" + "hg19";
        var trackhub = "&datahub=" + trackdbUrl;

        var url = urlBase + assembly + trackhub;
	
	console.log(url);
	
	window.open(url, '_blank');
    });
};
