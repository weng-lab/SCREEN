
/*
*  controller class
*  contains root methods for manipulation of data, JSON, etc.
*/
function regelm_details()
{
    this.annotation_colors = {"promoter": "255, 0, 0",
			      "enhancer": "255, 205, 0",
			      "dnase": "0, 218, 147",
			      "ctcf": "238, 80, 245"};
};

/* convert key ("promoter", "enhancer", etc.) and rank to color */
regelm_details.prototype.get_color = function(key, absolute, total) {
    var pct_rank = 1 - Math.log10(absolute) / Math.log10(total);
    return "rgba(" + this.annotation_colors[key] + ", " + pct_rank + ")";
};

/* convert rank to text color that will be visible on corresponding background color */
regelm_details.prototype.get_text_color = function(absolute, total) {
    var pct_rank = 1 - Math.log10(absolute) / Math.log10(total);
    return (pct_rank < 0.5 ? "#000000" : "#ffffff");
};

function get_search_ahref(s) {
    return '/search?q=' + s;
};

/* converts a gene symbol to a link to a page with details */
regelm_details.prototype.get_gene_href = function(symbol) {
    return get_search_ahref(symbol);
};

/* converts a SNP symbol to a link to a page with details */
regelm_details.prototype.get_snp_href = function(symbol) {
    return get_search_ahref(symbol);
};

/* converts an RE accession to a link to a page with details */
regelm_details.prototype.get_re_href = function(symbol) {
    return get_search_ahref(symbol);
};

/* converts a TF name to a link to a page with details */
regelm_details.prototype.get_tf_href = function(symbol) {
    return get_search_ahref(symbol);
};

/* converts a list of overlapping peaks to a link to a page with details */
regelm_details.prototype.get_genelist_href = function(symbol) {
    return get_search_ahref(symbol);
};

regelm_details.prototype.reformat_ranks = function(ranks) {
    reformatted = {};
    for (rank in ranks) {
	if (rank == "conservation") {
            continue;
        }
	reformatted[rank] = [];
	for (cell_line in ranks[rank]) {
	    reformatted[rank].push({"id": cell_line,
				    "absolute": ranks[rank][cell_line].rank,
				    "total": 4000000});
	}
    }
    return reformatted;
};

var regelm_details_base = new regelm_details();


/*
*  root GUI class
*  dynamically generates individual components
*/
function regelm_gui()
{

    this.GUIs = {
	"ranking_view": {
	    "proto": regelm_ranking_view,
	    "args": null
	},
	"genes_view": {
	    "proto": regelm_gene_view,
	    "args": {
		"header_text": "Nearest genes",
		"href_f": regelm_details_base.get_gene_href
	    }
	},
	"snp_view": {
	    "proto": regelm_gene_view,
	    "args": {
		"header_text": "Nearest SNPs",
		"href_f": regelm_details_base.get_snp_href
	    }
	},
	"re_view": {
	    "proto": regelm_gene_view,
	    "args": {
		"header_text": "Nearest candidate REs",
		"href_f": regelm_details_base.get_re_href
	    }
	},
	"tf_view": {
	    "proto": peak_overlap_view,
	    "args": {
		"header_text": "Intersecting TF peaks"
	    }
	},
	"histones_view": {
	    "proto": peak_overlap_view,
	    "args": {
		"header_text": "Intersecting histone peaks"
	    }
	},
	"peak_overlap_view": {
	    "proto": peak_overlap_view,
	    "args": {
		"header_text": "Other intersecting peaks"
	    }
	}
    };
    this._container = null;

};

var regelm_details_view = new regelm_gui();

/* create individual components within target div and wrap */
regelm_gui.prototype.bind = function(container_div_id){
    this.ranking_GUI = new regelm_ranking_view();
    this._container = document.getElementById(container_div_id);

    var leftArrow = document.createElement("span");
    leftArrow.className = "glyphicon glyphicon-arrow-left";
    leftArrow.setAttribute("id", "detailsLeftArrow");
    leftArrow.setAttribute("aria-hidden", "true");
    this._container.appendChild(leftArrow);

    this._header = document.createElement("h2");
    this._coordinates = document.createElement("h3");
    this._container.appendChild(this._header);
    this._container.appendChild(this._coordinates);

    var cf = document.createElement("div");
    cf.className = "container-fluid";
    
    var row = null;
    var i = 0;
    for (subGUI in this.GUIs){
	if(i%3 == 0){
	    if(null != row){
		cf.appendChild(row);
	    }
	    row = document.createElement("div");
	    row.className = "row";
	}

	var new_div = document.createElement("div");
	new_div.id = "regelm_view_" + subGUI;
	new_div.className = "col-md-4";
	this[subGUI] = new this.GUIs[subGUI].proto();
	this[subGUI].bind("regelm_view_" + subGUI, this.GUIs[subGUI].args,
			 new_div);
	row.appendChild(new_div);
	i += 1;
    }

    this._container.appendChild(cf);
};

/* set header text to given accession */
regelm_gui.prototype.set_header = function(accession){
    this._header.innerText = accession;
};

/* display given coordinates */
regelm_gui.prototype.set_coordinates = function(coordinates){
    this._coordinates.innerText = coordinates;
};

/*
*  rank subview
*  contains ranks for promoter, enhancer, dnase, etc. and functions for manipulation
*/
function regelm_ranking_view(){
    this._container = null;
    this._rank_nodes = {"promoter": null,
			"enhancer": null,
			"dnase": null,
			"ctcf": null}
};

/* dynamically generate contents within target div and wrap */
regelm_ranking_view.prototype.bind = function(container_div_id, args, new_div) {
    this._header = document.createElement("h3");
    this._header.innerText = "Top-ranked cell types";
    new_div.appendChild(this._header);

    this._table_div = document.createElement("div");
    new_div.appendChild(this._table_div);
};

/* for sorting ranks according to percentile */
function _regelm_ranks_comparator(a, b){
    return a.absolute / a.total - b.absolute / b.total;
};

/*
*  load the given cell line data
*  format is [{"rank": promoter|enhancer|etc., "absolute": absolute rank, "total": total elements ranked}, ...]
*/
regelm_ranking_view.prototype.load_cell_lines = function(data) {
    for (rank in this._rank_nodes) {
	if (rank in data && data[rank].length > 1) {
            return this._load_cell_lines(data);
        }
    }
    return this._load_cell_lines(data, true);
};

regelm_ranking_view.prototype.rankNames = function(s){
    lookups = { "promoter" : "promoter-like",
                "enhancer" : "enhancer-like",
                "dnase" : "DNase",
                "ctcf" : "CTCF" };
    if(s in lookups){
        return lookups[s];
    }
    return s;
}

/* private: do actual display of data once number of cell lines is known */
regelm_ranking_view.prototype._load_cell_lines = function(data,
							  single_cell_line) {
    if (typeof(single_cell_line)==='undefined') single_cell_line = false;
    
    clear_div_contents(this._table_div);
    var root_table = document.createElement("table");
    root_table.className = "table table-condensed";

    for (rank in this._rank_nodes) {
	if (rank in data) {
	    var tr = document.createElement("tr");
	    var thl = document.createElement("th");

            var rankName = this.rankNames(rank);
            thl.appendChild(document.createTextNode(rankName + ": "));
	    tr.appendChild(thl);

	    data[rank].sort(_regelm_ranks_comparator);

	    for (i in data[rank]) {
		var d = data[rank][i];
		var pct = 1.0 - d.absolute / d.total;
		var rank_td = document.createElement("td");

		rank_td.innerText = (single_cell_line ? data[rank][i].absolute + " / " + data[rank][i].total : d.id);
		rank_td.style.color = regelm_details_base.get_text_color(data[rank][i].absolute, data[rank][i].total);
		rank_td.style.backgroundColor = regelm_details_base.get_color(rank, data[rank][i].absolute, data[rank][i].total);
		rank_td.className = "regelm_rank_td";

		tr.appendChild(rank_td);
	    }
	    root_table.appendChild(tr);
	}
    }
    this._table_div.appendChild(root_table);
};


/*
*  gene view
*  dynamically generates list of nearest genes
*/
function regelm_gene_view(){
    this.nearest_genes = null;
    this._container = null;
};

/* for sorting genes by distance */
function _regelm_gene_comparator(a, b){
    return a.distance - b.distance;
};

/* dynamically generate components in target div */
regelm_gene_view.prototype.bind = function(container_div_id, args, new_div) {
    this._header = document.createElement("h3");
    this._header.innerText = args.header_text;
    new_div.appendChild(this._header);

    this._table_div = document.createElement("div");
    new_div.appendChild(this._table_div);

    this.href_f = args.href_f;
}

/*
*  displays a temporary loading message; replaces existing content
*/
regelm_gene_view.prototype.set_loading_text = function() {
    clear_div_contents(this._table_div);
    this._table_div.appendChild(document.createTextNode("Loading..."));
};

/*
*  loads the given gene list
*  format is [{"symbol": gene name/symbol, "distance": distance from RE}, ...]
*/
regelm_gene_view.prototype.load_list = function(data, result_limit) {
    if (typeof(result_limit)==='undefined') result_limit = -1;
    
    clear_div_contents(this._table_div);
    data.sort(_regelm_gene_comparator);

    var root_table = document.createElement("table");
    root_table.className = "table table-condensed";

    var header = document.createElement("tr");
    var nth = [document.createElement("th"),
	       document.createElement("th")];
    nth[0].appendChild(document.createTextNode("symbol"));
    nth[1].appendChild(document.createTextNode("distance (bp)"));
    header.appendChild(nth[0]);
    header.appendChild(nth[1]);
    root_table.appendChild(header);

    for (i in data) {
	if (result_limit != -1 && i >= result_limit) {
            break;
        }

	var row = data[i];
	var tr = document.createElement("tr");
	var ntd = [document.createElement("td"),
		   document.createElement("td")];

	var a = document.createElement("a");
	a.appendChild(document.createTextNode(row.name));
	a.href = this.href_f(row.name);
	ntd[0].appendChild(a);

	ntd[1].appendChild(document.createTextNode(row.distance.toLocaleString("en")));
	tr.appendChild(ntd[0]);
	tr.appendChild(ntd[1]);
	root_table.appendChild(tr);
    }

    this._table_div.appendChild(root_table);
};


/*
*  peak overlap view
*  display information on peak experiments which overlap the REs
*/
function peak_overlap_view(){
    this._container = null;
};

/* dynamically generate components in target div */
peak_overlap_view.prototype.bind = function(container_div_id, args, new_div) {
    this._header = document.createElement("h3");
    this._header.innerText = args.header_text;
    new_div.appendChild(this._header);

    this._table_div = document.createElement("div");
    new_div.appendChild(this._table_div);
}

function _regelm_overlap_comparator(a, b){
    return b.count - a.count;
}

function _regelm_overlap_cellline_comparator(a, b){
    return b.total - a.total;
}

/*
*  displays a temporary loading message; replaces existing content
*/
peak_overlap_view.prototype.set_loading_text = function() {
    clear_div_contents(this._table_div);
    this._table_div.appendChild(document.createTextNode("Loading..."));
};

/*
*  loads the given gene list
*  format is [{"symbol": gene name/symbol, "distance": distance from RE}, ...]
*/
peak_overlap_view.prototype.load_data = function(data, results_limit) {
    if (typeof(results_limit)==='undefined') results_limit = -1;
    
    clear_div_contents(this._table_div);

    var root_table = document.createElement("table");
    root_table.className = "table table-condensed";
    data.sort(_regelm_overlap_cellline_comparator);

    for (i in data) {
	if (results_limit != -1 && i >= results_limit) {
            break;
        }

	var results = data[i];
	var cell_line = results.id;
	var tr = document.createElement("tr");
	var ntd = [document.createElement("td"),
		   document.createElement("td")];

	var a = document.createElement("a");
	a.appendChild(document.createTextNode(cell_line));
	a.href = regelm_details_base.get_genelist_href(cell_line);
	ntd[0].appendChild(a);

	results.labels.sort(_regelm_overlap_comparator);

	for (j in results.labels) {
	    if (j != 0) ntd[1].innerText += ", ";
	    ntd[1].innerText += results.labels[j].count + " " + results.labels[j].id;
	}

	tr.appendChild(ntd[0]);
	tr.appendChild(ntd[1]);
	root_table.appendChild(tr);

    }
    this._table_div.appendChild(root_table);
};
