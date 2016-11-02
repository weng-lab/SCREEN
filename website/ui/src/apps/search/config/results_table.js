export const browser_buttons = (names) => {
    var bg = '<form class="btn-group" role="group">';
    for (var i = 0; i < names.length; i++) {
        bg += '<input role="button" class="btn btn-success btn-xs" type="submit" value="' + names[i] + '" style="width: 85px;">';
    }
    return bg + "</form>";
}

const cart_img = (rmv, src_only) => {
    var src = "/static/re_cart." + (rmv ? "rmv" : "add") + ".png";
    return (src_only ? src : '<img class="rowCart" src="' + src + '">');
}

export const render_int = {"display": (d) => (d == 1e12 ? "" : $.fn.dataTable.render.number( ',', '.', 0, '' )["display"](d))};
export const render_float = $.fn.dataTable.render.number( ',', '.', 1, '' );
export const render_gene = (d) => (d[0]["gene-name"] ? d[0]["gene-name"] : d[0]["gene-id"]);
export const render_cell_type = (d) => (d.replace(/_/g, " "));

const render_array = (m) => (array) => (
    array.length <= m ? array : [...array.slice(0, m), "..."]).join(", ");

const browser_button = (re, name) => {
    // TODO: make into React component...
    return '<form class="browserForm" onsubmit="event.preventDefault(); browserButtonClick(\'' + name + '\', \'' + re.accession + '\'); return false; ">' +
	'<input role="button" class="btn btn-success btn-xs" type="submit" value="' + name + '">' +
	'</form>';
}

const render_browser_buttons = (re) => (arr) => (
    '<div class="btn-group" role="group">' +
	browser_button(re, "UCSC") +
	browser_button(re, "WashU") +
	browser_button(re, "Ensembl") +
	'</div>'
);

const ResultsTableColumns = [
    {
	title: "accession",
	data: "_source.accession",
	className: "dt-right"
    },
    {
	title: "&#8209;log(p)",
	data: "_source.neg-log-p",
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
	data: "_source",
	className: "dt-right browser",
	orderable: false,
	render: render_browser_buttons
    }
];    
export default ResultsTableColumns;

export const table_order = [
    [1, "desc"],
    [2, "asc"],
    [3, "asc"],
    [4, "asc"]
];
