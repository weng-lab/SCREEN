function RE_table(){
    this.callback = null;
};

RE_table.prototype.genStrCol = function(field){
    return { data: field, className: "dt-right"};
}

RE_table.prototype.genFloatCol = function(field){
    return { data: field, className: "dt-right",
             render: $.fn.dataTable.render.number( ',', '.', 1, '' ) };
}

RE_table.prototype.genIntCol = function(field){
    return { data: field, className: "dt-right",
             render: $.fn.dataTable.render.number( ',', '.', 0, '' ) };
}

RE_table.prototype.genButtonGroupCol = function(names){
    var bg = '<div class="btn-group" role="group">';
    for(i = 0; i < names.length; i++){
        bg += '<button type="button" class="btn btn-default btn-xs">' + names[i] +
            '</button>';
    }
    bg += '</div>';
    return { targets: -1, data: null, className: "dt-right", orderable: false,
             defaultContent : bg };
}

function cart_img(rmv, src_only)
{
    var src = "/ver4/search/static/cart" + (rmv ? "rmv" : "add") + ".png";
    if (src_only) return src;
    return "<img src='" + src + "' width='56' height='56'>";
}

RE_table.prototype.genCartCol = function(field) {
    return {data: field, render: function(d) {return cart_img(cart.has_item(d), false)}};
};

RE_table.prototype.setupColumns = function(){
    var ret = {accession : this.genStrCol("_source.accession"),
	       "&#8209;log(p)" : this.genFloatCol("_source.confidence"),
               //Genome : this.genStrCol("_source.genome"),
	       chr : this.genStrCol("_source.position.chrom"),
               start : this.genIntCol("_source.position.start"),
	       end : this.genIntCol("_source.position.end")}

    if(searchquery.has_cell_line_filter()){
        var cellType = searchquery.cell_line;
        ret["nearest gene"] = this.genStrCol("_source.genes.nearest-all.gene-id");
        ret["nearest protein-coding gene"] =
            this.genStrCol("_source.genes.nearest-pc.gene-id");
    }

    ret["cart"] = this.genCartCol("_source");
    ret["genome browsers"] = this.genButtonGroupCol(["UCSC", "WashU", "Ensembl"]);

    return ret;
}

RE_table.prototype.makeEmptyTable = function(cols){
    var colNames = _.keys(cols);

    var frag = document.createDocumentFragment();
    for(i = 0; i < colNames.length; i++){
        var th = document.createElement("th");
        th.innerHTML = colNames[i];
        frag.appendChild(th);
    }
    var tr = document.createElement("tr");
    tr.appendChild(frag)
    var thead = document.createElement("thead");
    thead.appendChild(tr);
    var table = document.createElement("table");
    table.id = "searchresults_table";
    table.appendChild(thead);

    return table;
}

RE_table.prototype.setCallback = function(f){
    this.callback = f;
}

RE_table.prototype.runCallback = function(f){
    if(this.callback){
	this.callback();
	this.callback = null;
    }
}
 
RE_table.prototype.renderTable = function(){
    var cols = this.setupColumns();

    $("#searchresults_div").html(this.makeEmptyTable(cols));

    var dtable = $("#searchresults_table").DataTable( {
        destroy: true,
        processing: true,
        columns: _.values(cols),
        order: [[1, "desc"],
        	[3, "asc"],
        	[4, "asc"]
               ],
	bFilter: false,
	serverSide: true,
	ajax: function ( request, callback, settings ) {
	    var requestStart  = request.start;
	    var requestLength = request.length;
	    
	    searchquery.eso["from"] = requestStart;
	    searchquery.eso["size"] = requestLength;
	    
	    re_table.setCallback(function(){
		var numFil = results.results.total;
		if(numFil > 5000){
		    numFil = 5000;
		}
		var json = {
		    data : results.results.hits,
		    recordsTotal : results.results.total,
		    recordsFiltered : numFil
		};
		callback(json);
	    });
	    
	    perform_search();
	}
    } );

    $("#searchresults_table").removeClass('display')
	.addClass('table table-condensed table-hover');
    
    // deal w/ genome browser button click
    $('#searchresults_table tbody').on( 'click', 'button', function () {
	var whichBrowser = $(this).html();
	var data = result_from_table_button(dtable, $(this));
        var reAccession = data["accession"];
        //console.log(whichBrowser, reAccession);
	//console.log(data);

	var halfWindow = 7500;
	
	if("UCSC" == whichBrowser){
	    var  url = "https://genome.ucsc.edu/cgi-bin/hgTracks?";
	    url += "db=hg19";

	    var chrom = data["position"]["chrom"]
	    var start = data["position"]["start"];
	    var end = data["position"]["end"];
	    
	    start = Math.max(1, start - halfWindow);
            end = end + halfWindow;
	    
	    url += "&position=" + chrom + ':' + start + '-' + end;
	    	    
            var trackhubUrl = "http://megatux.purcaro.com:9002" +
		[Ver(),
                 "ucsc_trackhub",
		 reAccession,
		 "hub_" + Session_Uid + ".txt"].join('/');
	    url += "&hubClear=" + trackhubUrl;

	    console.log(url);
	    
	    window.open(url, '_blank');
	}
	
    } );

    // deal w/ RE row click
    $('#searchresults_table').on( 'click', 'tr', function() {
	$(this).addClass('info');
	var r = result_from_tablerow(dtable, $(this));

	$("#redetails").html("");
	regelm_details_view.bind("redetails");

	showTab("tab_details");
	
	request_details(r);
	
	regelm_details_view.set_header(r.accession);
	regelm_details_view.peak_overlap_view.set_loading_text();
	regelm_details_view.tf_view.set_loading_text();
	regelm_details_view.histones_view.set_loading_text();	
	regelm_details_view.snp_view.set_loading_text();
	regelm_details_view.genes_view.set_loading_text();
	regelm_details_view.re_view.set_loading_text();

	regelm_details_view.ranking_view.load_cell_lines(
	    regelm_details_base.reformat_ranks(r.ranks));

	$("#detailsLeftArrow").click(function(){
	    showTab("tab_results");
	});	
    });

    $('#searchresults_table').on( 'click', 'img', function() {
	var i = $(this);
	var r = result_from_table_button(dtable, i);
	if (cart.has_item(r)) {
	    cart.remove_item(r);
	} else {
	    cart.add_item(r);
	}
	i.attr("src", cart_img(cart.has_item(r), true));
    });
    
}

function result_from_tablerow(dtable, tr){
    var data = dtable.row(tr).data();
    return data["_source"];
}

function result_from_table_button(dtable, t){
    var data = dtable.row(t.parents('tr')).data();
    return data["_source"];
}
