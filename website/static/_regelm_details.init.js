
/*
*  controller class
*  contains root methods for manipulation of data, JSON, etc.
*/
function regelm_details()
{
    this.annotation_colors = {"promoter": "255, 0, 0",
			      "enhancer": "255, 205, 0",
			      "dnase": "0, 218, 147",
			      "CTCF": "238, 80, 245"};
};

/* convert key ("promoter", "enhancer", etc.) and rank to color */
regelm_details.prototype.get_color = function(key, absolute, total) {
    var pct_rank = 1 - Math.log10(absolute) / Math.log10(total);
    return "rgba(" + this.annotation_colors[key] + ", " + pct_rank + ")";
};

/* converts a gene symbol to a link to a page with details */
regelm_details.prototype.get_gene_href = function(symbol) {
    return "#"; // TODO: link to gene info page
};

/* converts a SNP symbol to a link to a page with details */
regelm_details.prototype.get_snp_href = function(symbol) {
    return "#"; // TODO: link to SNP info page
};

/* converts an RE accession to a link to a page with details */
regelm_details.prototype.get_re_href = function(symbol) {
    return "#"; // TODO: link to RE info page
};

/* converts a TF name to a link to a page with details */
regelm_details.prototype.get_tf_href = function(symbol) {
    return "#"; // TODO: link to RE info page
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
		"header_text": "nearest genes",
		"href_f": regelm_details_base.get_gene_href
	    }
	},
	"snp_view": {
	    "proto": regelm_gene_view,
	    "args": {
		"header_text": "nearest SNPs",
		"href_f": regelm_details_base.get_snp_href
	    }
	},
	"re_view": {
	    "proto": regelm_gene_view,
	    "args": {
		"header_text": "nearest regulatory elements",
		"href_f": regelm_details_base.get_re_href
	    }
	},
	"tf_view": {
	    "proto": regelm_gene_view,
	    "args": {
		"header_text": "interacting TFs",
		"href_f": regelm_details_base.get_tf_href
	    }
	}
    };	
    this._container = null;
    
};

/* create individual components within target div and wrap */
regelm_gui.prototype.bind = function(container_div_id)
{
    
    this.ranking_GUI = new regelm_ranking_view();
    this._container = document.getElementById(container_div_id);

    this._header = document.createElement("h2");
    this._coordinates = document.createElement("h3");
    this._container.appendChild(this._header);
    this._container.appendChild(this._coordinates);
    
    for (subGUI in this.GUIs) {
	var new_div = document.createElement("div");
	new_div.id = "regelm_view_" + subGUI;
	this._container.appendChild(new_div);
	this[subGUI] = new this.GUIs[subGUI].proto();
	this[subGUI].bind("regelm_view_" + subGUI, this.GUIs[subGUI].args);
    }
    
};

/* set header text to given accession */
regelm_gui.prototype.set_header = function(accession)
{
    this._header.innerText = accession;
};

/* display given coordinates */
regelm_gui.prototype.set_coordinates = function(coordinates)
{
    this._coordinates.innerText = coordinates;
};


/*
*  rank subview
*  contains ranks for promoter, enhancer, dnase, etc. and functions for manipulation
*/
function regelm_ranking_view()
{
    this._container = null;
    this._rank_nodes = {"promoter": null,
			"enhancer": null,
			"dnase": null,
			"CTCF": null}
};

/* dynamically generate contents within target div and wrap */
regelm_ranking_view.prototype.bind = function(container_div_id, args) {

    this._container = document.getElementById(container_div_id);

    this._header = document.createElement("h3");
    this._header.innerText = "ranks";
    this._container.appendChild(this._header);

    this._table_div = document.createElement("div");
    this._container.appendChild(this._table_div);
    
};

/* for sorting ranks according to percentile */
function _regelm_ranks_comparator(a, b)
{
    return a.absolute / a.total - b.absolute / b.total;
};

/*
*  load the given cell line data
*  format is [{"rank": promoter|enhancer|etc., "absolute": absolute rank, "total": total elements ranked}, ...]
*/
regelm_ranking_view.prototype.load_cell_lines = function(data) {

    for (rank in this._rank_nodes) {
	if (rank in data && data[rank].length > 1) return this._load_cell_lines(data);
    }
    return this._load_cell_lines(data, true);
    
};

/* private: do actual display of data once number of cell lines is known */
regelm_ranking_view.prototype._load_cell_lines = function(data, single_cell_line = false) {

    clear_div_contents(this._table_div);
    var root_table = document.createElement("table");
    root_table.cellPadding = 5;
    
    for (rank in this._rank_nodes) {
	
	if (rank in data) {

	    var tr = document.createElement("tr");
	    var thl = document.createElement("th");
	    thl.appendChild(document.createTextNode(rank + ": "));
	    tr.appendChild(thl);
	    
	    data[rank].sort(_regelm_ranks_comparator);
	    
	    for (i in data[rank]) {

		var d = data[rank][i];
		var pct = 1.0 - d.absolute / d.total;
		var rank_td = document.createElement("td");
		
		rank_td.innerText = (single_cell_line ? data[rank][i].absolute + " / " + data[rank][i].total : d.id);
		rank_td.style.color = (pct > 0.5 ? "#ffffff" : "#000000");
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
function regelm_gene_view()
{
    this.nearest_genes = null;
    this._container = null;
};

/* for sorting genes by distance */
function _regelm_gene_comparator(a, b)
{
    return a.distance - b.distance;
};

/* dynamically generate components in target div */
regelm_gene_view.prototype.bind = function(container_div_id, args) {

    this._container = document.getElementById(container_div_id);

    this._header = document.createElement("h3");
    this._header.innerText = args.header_text;
    this._container.appendChild(this._header);

    this._table_div = document.createElement("div");
    this._container.appendChild(this._table_div);

    this.href_f = args.href_f;
    
}

/*
*  loads the given gene list
*  format is [{"symbol": gene name/symbol, "distance": distance from RE}, ...]
*/
regelm_gene_view.prototype.load_list = function(data) {
    
    clear_div_contents(this._table_div);
    data.sort(_regelm_gene_comparator);

    var root_table = document.createElement("table");
    var header = document.createElement("tr");
    var nth = [document.createElement("th"),
	       document.createElement("th")];
    nth[0].appendChild(document.createTextNode("symbol"));
    nth[1].appendChild(document.createTextNode("distance"));
    header.appendChild(nth[0]);
    header.appendChild(nth[1]);
    root_table.appendChild(header);
    
    for (i in data) {

	var row = data[i];
	var tr = document.createElement("tr");
	var ntd = [document.createElement("td"),
		   document.createElement("td")];

	var a = document.createElement("a");
	a.appendChild(document.createTextNode(row.name));
	a.href = this.href_f(row.name);
	ntd[0].appendChild(a);

	ntd[1].appendChild(document.createTextNode(row.distance));
	tr.appendChild(ntd[0]);
	tr.appendChild(ntd[1]);
	root_table.appendChild(tr);
	
    }

    this._table_div.appendChild(root_table);
    
};
