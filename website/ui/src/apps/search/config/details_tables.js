import * as Render from '../../../common/renders'

import IntersectingAssayTf from '../components/intersecting_assay_tf'
import IntersectingAssayHistone from '../components/intersecting_assay_histone'

export const TopTissuesTables = () => ({
    "promoter": {
	title: "Promoter Z-scores",
	cols: [
	    {title: "cell type", data: "ct", className: "dt-right",
		render: Render.cell_type},
	    {title: "H3K4me3 and DNase", data: "two",
	     render: Render.z_score},
	    {title: "H3K4me3 only", data: "one",
	     render: Render.z_score}
	],
	order: [[2, "desc"], [1, "desc"]],
	pageLength: 5,
	paging: true,
	bar_graph: false, //GlobalAssembly != "hg19",
        bLengthChange: false,
	rank_f: (d) => (Math.log(d["one"]))
    },
    "enhancer": {
	title: "Enhancer Z-scores",
	cols: [
	    {title: "cell type", data: "ct", className: "dt-right",
	     render: Render.cell_type},
	    {title: "H3K27ac and DNase", data: "two",
	     render: Render.z_score},
	    {title: "H3K27ac only", data: "one",
	     render: Render.z_score}
	],
	order: [[2, "desc"], [1, "desc"]],
	pageLength: 5,
	paging: true,
	bar_graph: false, //GlobalAssembly != "hg19",
        bLengthChange: true,
	rank_f: (d) => (Math.log(d["one"]))
    },
    "ctcf": {
	title: "CTCF Z-scores",
	cols: [
	    {title: "cell type", data: "ct", className: "dt-right",
	     render: Render.cell_type},
	    {title: "CTCF and DNase", data: "two",
             render: Render.z_score},
	    {title: "CTCF only", data: "one",
	     render: Render.z_score
	    }
	],
	order: [[2, "desc"], [1, "desc"]],
	pageLength: 5,
	paging: true,
	bar_graph: false, //GlobalAssembly != "hg19",
        bLengthChange: true,
	rank_f: (d) => (Math.log(d["one"]))
    },
    "dnase": {
	title: "DNase Z-scores",
	cols: [
	    {title: "cell type", data: "ct", className: "dt-right",
		render: Render.cell_type},
	    {title: "Z-score", data: "one",
	     render: Render.z_score
	    }
	],
	order: [[1, "desc"]],
	pageLength: 5,
	paging: true,
	bar_graph: false, //GlobalAssembly != "hg19",
        bLengthChange: true,
	rank_f: (d) => (Math.log(d["one"]))
    }
});

export const OrthologTable = () => ({
    "ortholog": {
	"title": "",
	paging: false,
	info: false,
	bFilter: false,
	bLengthChange: false,
	emptyText: "No orthologous cRE identified",
	cols: [
	    {title: "accession", "data": "accession", className: "dt-right",
             render: Render.relink(GlobalAssembly == "mm10" ? "hg19" : "mm10")},
	    {title: "chromosome", "data": "chrom", className: "dt-right"},
	    {title: "start", "data": "start", render: Render.integer},
	    {title: "end", "data": "stop", render: Render.integer},
	    {title: "overlap", "data": "overlap", render: Render.bp}
	],
	order: [[4, "desc"]]
    }
});

export const TargetGeneTable = () => ({
    "candidate_links": {
	title: "",
	paging: true,
	info: true,
	bFilter: true,
        bLengthChange: true,
	emptyText: "No target genes predicted",
	cols: [
	    {title: "name", data: "gene.common-gene-name",  className: "dt-right",
	     render: Render.gene_link},
            {title: "ensembl ID", data: "gene.ensemble-id", className: "dt-right"},
            {title: "# supporting exps", data: "evidence",
             render: Render.support},
            {title: "# ChIA-PET exps", data: "evidence.chiapet",
             render: Render.len},
	    {title: "ChIA-PET cell types", data: "evidence.chiapet",
	     render: Render.supporting_cts},
	    {title: "# eQTL exps", data: "evidence.eqtls",
	     render: Render.len},
	    {title: "eQTL cell types", data: "evidence.eqtls",
	     render: Render.supporting_cts}],
	order: [[2, "desc"]]
    }
});

export const NearbyGenomicTable = () => ({
    "nearby_genes": {
	title: "Nearby Genes",
	paging: true,
	info: false,
	bFilter: false,
        bLengthChange: true,
	emptyText: "No genes within 1Mb",
	cols: [
	    {title: "symbol", data: "name",
	     render: Render.gene_link},
	    {title: "distance", data: "distance",
	     render: Render.integer}],
        pageLength: 5,
	order: [[1, "asc"]]
    },
    "nearby_res": {
	title: "Nearby cREs",
	paging: true,
	info: false,
	bFilter: false,
        bLengthChange: true,
	cols: [
	    {title: "accession", data: "name", className: "dt-right",
	     render: Render.relink(GlobalAssembly) },
	    {title: "distance", data: "distance",
	     render: Render.integer } ],
        pageLength: 5,
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
	     render: Render.snp_link },
	    {title: "distance",	data: "distance",
	     render: Render.integer }],
        pageLength: 5,
	order: [[1, "asc"]]
    },
    "blank": null,
    "tads": {
	title: "Genes within TAD",
	paging: true,
	info: false,
	bFilter: false,
        bLengthChange: true,
	emptyText: "No genes within TAD",
	cols: [
	    {title: "symbol", data: "name",
	     render: Render.gene_link},
	    //{title: "coordinates", data: "coordinates"}
        ],
        pageLength: 5,
	order: [[0, "asc"]]
    },
    "re_tads": {
	title: "Other cREs within TAD (<1Mb)",
	paging: true,
	info: false,
	bFilter: false,
        bLengthChange: true,
	emptyText: "No cREs within TAD with 1Mb",
	cols: [
	    {title: "accession", data: "accession",
	     render: Render.relink(GlobalAssembly) },
	    {title: "distance", data: "distance"} ],
        pageLength: 5,
	order: [[1, "asc"]],
	onTdClick: (actions) => (i, d) => { actions.showReDetail(d.name)}
    }
});

export const TfIntersectionTable = () => ({
    "tf": {
	title: "TFs that bind this cRE",
        typ: IntersectingAssayTf,
	cols: [
	    {title: "factor", data: "name",
	     render: Render.factorbook_link_tf },
	    {title: "# experiments", data: "n",
	     render: Render.integer }],
	order: [[1, "desc"]]
    },
    "histone": {
	title: "Histone Marks at this cRE",
        typ: IntersectingAssayHistone,
	cols: [
	    {title: "mark", data: "name" },
	    //render: Render.factorbook_link_histone },
	    {title: "# experiments", data: "n",
	     render: Render.integer }],
	order: [[1, "desc"]]
    },

    /*
    "dnase": {
	title: "Intersecting DNases",
	cols: [
	    {title: "mark", data: "name"},
	    {title: "# experiments", data: "n",
	     render: Render.integer }],
	order: [[1, "desc"]]
    } */
});
