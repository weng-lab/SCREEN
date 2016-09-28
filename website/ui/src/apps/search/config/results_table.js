const browser_buttons = (names) => {
    var bg = '<div class="btn-group" role="group">';
    for (var i = 0; i < names.length; i++) {
        bg += '<button type="button" class="btn btn-default btn-xs">' + names[i] + '</button>';
    }
    return bg + "</div>";
}

const cart_img = (rmv, src_only) => {
    var src = "/static/re_cart." + (rmv ? "rmv" : "add") + ".png";
    return (src_only ? src : '<img class="rowCart" src="' + src + '">');
}

export const render_int = $.fn.dataTable.render.number( ',', '.', 0, '' );
export const render_float = $.fn.dataTable.render.number( ',', '.', 1, '' );
export const render_gene = (d) => (d["gene-name"] ? d["gene-name"] : d["gene-id"]);

const ResultsTableColumns = [
    {
	title: "accession",
	data: "_source.accession",
	className: "dt-right"
    },
    {
	title: "&#8209;log(p)",
	data: "_source.confidence",
	className: "dt-right",
        render: render_float
    },
    {
	title: "chr",
	data: "_source.position.chrom",
	className: "dt-right"
    },
    {
	title: "start",
	data: "_source.position.start",
	className: "dt-right",
        render: render_int
    },
    {
	title: "end",
	data: "_source.position.end",
	className: "dt-right",
        render: render_int
    },
    {
	title: "nearest gene",
	data: "_source.genes.nearest-all",
	className: "dt-right",
	render: render_gene
    },
    {
	title: "nearest protein-coding gene",
	data: "_source.genes.nearest-pc",
	className: "dt-right",
	render: render_gene
    },
    {
	title: "cart",
	data: "_source.in_cart",
	render: (d) => cart_img(d, false),
	className: "cart"
    },
    {
	title: "genome browsers",
	targets: -1,
	data: null,
	className: "dt-right browser",
	orderable: false,
        defaultContent: browser_buttons([
	    "UCSC",
	    "WashU",
	    "Ensembl"
	])
    }
];    
export default ResultsTableColumns;

export const results_order = [];
