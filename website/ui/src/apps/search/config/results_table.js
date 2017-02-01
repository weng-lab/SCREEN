export const browser_buttons = (names) => {
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

export const render_int = {"display": (d) => (d == 1e12 ? "" : $.fn.dataTable.render.number( ',', '.', 0, '' )["display"](d))};
export const render_float = $.fn.dataTable.render.number( ',', '.', 1, '' );
export const render_z_score = (d) => (d == -1e12 ? "" : $.fn.dataTable.render.number(',', '.', 2, '')["display"](d));
export const render_cell_type = (d) => (d.replace(/_/g, " "));

const render_array = (m) => (array) => (
    array.length <= m ? array : [...array.slice(0, m), "..."]).join(", ");

const render_gene_button = (d) => {
    var ge = '<a href="/geneexp/' + GlobalAssembly + '/' + d + '" target="_blank">' + d + '</a>';
    if("mm10" != GlobalAssembly){
        return ge;
    }
    var de = '<a href="/deGene/' + GlobalAssembly + '/' + d + '" target="_blank">&Delta;</a>';
    return ge + '&nbsp;&nbsp;' + de;
};

const ResultsTableColumns = [
    {
	title: "accession",
	data: "accession",
	className: "dt-right"
    },
    {
	title: "&#8209;log(p)",
	data: "neglogp",
	className: "dt-right",
        render: render_float
    },
    {
	title: "chr",
	data: "chrom",
	className: "dt-right"
    },
    {
	title: "start",
	data: "start",
	className: "dt-right",
        render: render_int
    },
    {
	title: "end",
	data: "stop",
	className: "dt-right",
        render: render_int
    },
    {
	title: "nearest gene",
	data: "gene_all",
	className: "dt-right geneexp",
	render: render_gene_button
    },
    {
	title: "nearest protein-coding gene",
	data: "gene_pc",
	className: "dt-right geneexp",
	render: render_gene_button
    },
    {
	title: "cart",
	data: "in_cart",
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

export const table_order = [
    [1, "desc"],
    [2, "asc"],
    [3, "asc"],
    [4, "asc"]
];
