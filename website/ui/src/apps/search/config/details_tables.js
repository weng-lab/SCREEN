import {render_int, render_cell_type} from './results_table'

import {render_support, render_length, render_supporting_cts} from '../../geneexp/components/candidate_res'

const render_factorbook_link_tf = (d) => (
    '<a href="http://beta.factorbook.org/human/chipseq/tf/' + d + '" target="_blank">' + d + '</a>');

const render_factorbook_link_histone = (d) => (
    '<a href="http://beta.factorbook.org/human/chipseq/histone/' + d + '" target="_blank">' + d + '</a>');

const render_snp_link = (d) => {
    var url = "http://ensembl.org/Homo_sapiens/Variation/Explore";
    if("mm10" == GlobalAssembly){
        url = "http://ensembl.org/Mus_musculus/Variation/Explore";
    }
    return '<a href="' + url + '?vdb=variation;v=' + d + '" target="_blank">' + d + '</a>';
}

const render_gene_link = (d) => (
    '<a href="http://www.genecards.org/cgi-bin/carddisp.pl?gene=' + d + '" target="_blank">' + d + '</a>');

const render_re_link = (d) => ('<a>' + d + '</a>');

const render_position = (pos) => (pos.chrom + ":" + pos.start + "-" + pos.end);

export const TopTissuesTables = {
    "promoter": {
	title: "Promoter ranks",
	cols: [
	    {title: "cell type", data: "ct", className: "dt-right",
		render: render_cell_type},
	    {title: "H3K4me3 and DNase", data: "dnase+h3k4me3",
	     render: render_int},
	    {title: "H3K4me3 only", data: "h3k4me3-only",
	     render: render_int}
	],
	data: [],
	order: [[2, "asc"], [1, "asc"]],
	pageLength: 5,
	paging: false,
	bar_graph: true,
        bLengthChange: false,
	rank_f: (d) => (Math.log(d["h3k4me3-only"]))
    },
    "enhancer": {
	title: "Enhancer ranks",
	cols: [
	    {title: "cell type", data: "ct", className: "dt-right",
	     render: render_cell_type},
	    {title: "H3K27ac and DNase", data: "dnase+h3k27ac",
	     render: render_int},
	    {title: "H3K27ac only", data: "h3k27ac-only",
	     render: render_int}
	],
	data: [],
	order: [[2, "asc"], [1, "asc"]],
	pageLength: 5,
	paging: false,
	bar_graph: true,
        bLengthChange: true,
	rank_f: (d) => (Math.log(d["h3k27ac-only"]))
    },
    "ctcf": {
	title: "CTCF ranks",
	cols: [
	    {title: "cell type", data: "ct", className: "dt-right",
	     render: render_cell_type},
	    {title: "CTCF and DNase", data: "dnase+ctcf",
             render: render_int},
	    {title: "CTCF only", data: "ctcf-only",
	     render: render_int
	    }
	],
	data: [],
	order: [[2, "asc"], [1, "asc"]],
	pageLength: 5,
	paging: false,
	bar_graph: true,
        bLengthChange: true,
	rank_f: (d) => (Math.log(d["ctcf-only"]))
    },
    "dnase": {
	title: "DNase ranks",
	cols: [
	    {title: "cell type", data: "ct", className: "dt-right",
		render: render_cell_type},
	    {title: "rank", data: "dnase",
	     render: render_int
	    }
	],
	data: [],
	order: [[1, "asc"]],
	pageLength: 5,
	paging: false,
	bar_graph: true,
        bLengthChange: true,
	rank_f: (d) => (Math.log(d["dnase"]))
    }
};

export const TargetGeneTable = {
    "candidate_links": {
	title: "",
	paging: true,
	info: true,
	bFilter: true,
        bLengthChange: true,
	emptyText: "No target genes predicted",
	cols: [
	    {title: "name", data: "gene.common-gene-name",  className: "dt-right",
	     render: render_gene_link},
            {title: "ensembl ID", data: "gene.ensemble-id", className: "dt-right"},
            {title: "# supporting exps", data: "evidence",
             render: render_support},
            {title: "# ChIA-PET exps", data: "evidence.chiapet",
             render: render_length},
	    {title: "ChIA-PET cell types", data: "evidence.chiapet",
	     render: render_supporting_cts},
	    {title: "# eQTL exps", data: "evidence.eqtls",
	     render: render_length},
	    {title: "eQTL cell types", data: "evidence.eqtls",
	     render: render_supporting_cts}],
	data: [],
	order: [[2, "desc"]]
    }
};

export const NearbyGenomicTable = {
    "nearby_genes": {
	title: "Nearby genes",
	paging: false,
	info: false,
	bFilter: false,
        bLengthChange: true,
	emptyText: "No genes within 1Mb",
	cols: [
	    {title: "symbol", data: "name",
	     render: render_gene_link},
	    {title: "distance", data: "distance",
	     render: render_int}],
        pageLength: 5,
	order: [[1, "asc"]]
    },
    "tads": {
	title: "Genes within TAD",
	paging: true,
	info: false,
	bFilter: false,
        bLengthChange: true,
	emptyText: "No genes within TAD",
	cols: [
	    {title: "symbol", data: "name",
	     render: render_gene_link},
	    //{title: "coordinates", data: "coordinates"}
        ],
        pageLength: 5,
	order: [[0, "asc"]]
    },
    "re_tads": {
	title: "Other REs within TAD",
	paging: true,
	info: false,
	bFilter: false,
        bLengthChange: true,
	emptyText: "No REs within TAD",
	cols: [
	    {title: "accession", data: "accession",
	     render: render_re_link },
	    {title: "coordinates", data: "position",
	     render:  render_position }	],
        pageLength: 5,
	order: [[0, "asc"]],
	onTdClick: (actions) => (i, d) => { actions.showReDetail(d.name)}
    },
    "nearby_res": {
	title: "Nearby candidate REs",
	paging: true,
	info: false,
	bFilter: false,
        bLengthChange: true,
	cols: [
	    {title: "accession", data: "name", className: "dt-right",
	     render: render_re_link },
	    {title: "distance", data: "distance",
	     render: render_int } ],
        pageLength: 10,
	order: [[1, "asc"]],
	onTdClick: (actions) => (i, d) => { actions.showReDetail(d.name)}
    },
    "overlapping_snps": {
	title: "Nearby SNPs",
	paging: true,
	info: false,
	bFilter: false,
        bLengthChange: true,
	emptyText: "No SNPs within 10Kb",
	cols: [
	    {title: "accession", data: "name",
	     render: render_snp_link },
	    {title: "distance",	data: "distance",
	     render: render_int }],
        pageLength: 5,
	order: [[1, "asc"]]
    }
}

export const TfIntersectionTable = {
    "tf": {
	title: "Intersecting TFs",
	cols: [
	    {title: "factor", data: "name",
	     render: render_factorbook_link_tf },
	    {title: "# experiments", data: "n",
	     render: render_int }],
	data: [],
	order: [[1, "desc"]]
    },
    "histone": {
	title: "Intersecting Histones",
	cols: [
	    {title: "mark", data: "name",
	     render: render_factorbook_link_histone },
	    {title: "# experiments", data: "n",
	     render: render_int }],
	data: [],
	order: [[1, "desc"]]
    }
}
