import $ from 'jquery';

import * as Render from '../../../common/zrenders';

import IntersectingAssayTf from '../components/intersecting_assay_tf';
import IntersectingAssayHistone from '../components/intersecting_assay_histone';

/*global GlobalAssembly */
/*eslint no-undef: "error"*/

const fantomcat_link = (d) => (
    "<a href='http://fantom.gsc.riken.jp/cat/v1/#/genes/" + d + "'>" + d + "</a>"
);

const gene_link_list = (d) => (
    d.split(", ").map(Render.gene_link).join(", ")
);

export const TopTissuesTables = () => ({
    promoter: {
	title: "H3K4me3 Z-scores",
	helpkey: "H3K4me3Z-scores",
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
	bFilter: true,
	rank_f: (d) => (Math.log(d["one"]))
    },
    enhancer: {
	title: "H3K27ac Z-scores",
	helpkey: "H3K27acZ-scores",
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
	bFilter: true,
	rank_f: (d) => (Math.log(d["one"]))
    },
    ctcf: {
	title: "CTCF Z-scores",
	helpkey: "CTCFZ-scores",
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
	bFilter: true,
	rank_f: (d) => (Math.log(d["one"]))
    },
    dnase: {
	title: "DNase Z-scores",
	helpkey: "DNaseZ-scores",
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
	bFilter: true,
	rank_f: (d) => (Math.log(d["one"]))
    }
});

export const OrthologTable = () => ({
    ortholog: {
	title: "",
	paging: false,
	info: false,
	bFilter: true,
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

export const FantomCatTable = (actions) => ({
    fantom_cat_twokb: {
	title: "Intersecting FANTOM CAT RNAs (cRE within 2kb of RNA TSS)",
	cols: [
	    {title: "FANTOM CAT RNA accession", data: "geneid", className: "dt-right", render: fantomcat_link},
	    {title: "aliases", data: "other_names", className: "dt-right", render: gene_link_list},
	    {title: "RNA class", data: "geneclass", className: "dt-right"},
	    {title: "chr", data: "chrom", className: "dt-right"},
	    {title: "start", data: "start", render: Render.integer},
	    {title: "end", data: "stop", render: Render.integer},
	    {title: "", data: null,
	     className: "browser",
	     targets: -1, orderable: false,
	     defaultContent: Render.browser_buttons(["UCSC"]) }
	],
	onButtonClick: (td, rowdata) => {
	    actions.showGenomeBrowser({
		title: rowdata.geneid + " (TSS +/- 2kb)",
		start: rowdata.start - 2000,
		len: 4000,
		chrom: rowdata.chrom
	    }, "UCSC", "FantomCAT")
	},
	order: [[3, "asc"], [4, "asc"], [5, "asc"]],
	pagLength: 5,
	paging: true,
	bar_graph: false,
	bLengthChange: true,
	bFilter: true
    },
    fantom_cat: {
	title: "Intersecting FANTOM CAT RNAs (cRE within entire RNA body)",
	cols: [
	    {title: "FANTOM CAT RNA accession", data: "geneid", className: "dt-right", render: fantomcat_link},
	    {title: "aliases", data: "other_names", className: "dt-right", render: gene_link_list},
	    {title: "RNA class", data: "geneclass", className: "dt-right"},
	    {title: "chr", data: "chrom", className: "dt-right"},
	    {title: "start", data: "start", render: Render.integer},
	    {title: "end", data: "stop", render: Render.integer},
	    {title: "", data: null,
	     className: "browser",
	     targets: -1, orderable: false,
	     defaultContent: Render.browser_buttons(["UCSC"]) }
	],
	onButtonClick: (td, rowdata) => {
	    actions.showGenomeBrowser({
		title: rowdata.geneid,
		start: rowdata.start,
		len: rowdata.stop - rowdata.start,
		chrom: rowdata.chrom
	    }, "UCSC", "FantomCAT")
	},
	order: [[3, "asc"], [4, "asc"], [5, "asc"]],
	pagLength: 5,
	paging: true,
	bar_graph: false,
	bLengthChange: true,
	bFilter: true
    }
});

export const TargetGeneTable = () => ({
    candidate_links: {
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

const table_click_handler = (td, snp) => {
    if (td.className.indexOf("browser") != -1){
	var half_window = 7500;
	var arr = window.location.href.split("/");
	var host = arr[0] + "//" + arr[2];
	var data = JSON.stringify({"snp" : snp,
				   "halfWindow" : half_window,
				   "host" : host,
				   GlobalAssembly});
	var url = "/ucsc_trackhub_url_snp";

	$.ajax({
	    type: "POST",
	    url: url,
	    data: data,
	    dataType: "json",
	    contentType : "application/json",
	    async: false, // http://stackoverflow.com/a/20235765
	    success: (r) => {
		if ("err" in r) {
		    $("#errMsg").text(r.err);
		    $("#errBox").show()
		    return true;
		}
		console.log(r.url, r.trackhubUrl);
		window.open(r.url, '_blank');
	    },
	    error: (a, b, c) => {
		console.log(a);
	    }
	});
    }
};

export const NearbyGenomicTable = () => {
    let ret = {
        nearby_genes: {
	    title: "Nearby Genes",
	    helpkey: "Nearby_genes",
	    paging: true,
	    info: false,
	    bFilter: true,
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
        nearby_res: {
	    title: "Nearby cREs",
	    helpkey: "Nearby_cREs",
	    paging: true,
	    info: false,
	    bFilter: true,
            bLengthChange: true,
	    cols: [
	        {title: "accession", data: "name", className: "dt-right",
	         render: Render.relink(GlobalAssembly) },
	        {title: "distance", data: "distance",
	         render: Render.integer } ],
            pageLength: 5,
	    order: [[1, "asc"]]
        },
        overlapping_snps: {
	    title: "Nearby SNPs",
	    helpkey: "Nearby_SNPs",
	    paging: true,
	    info: false,
	    bFilter: true,
            bLengthChange: true,
	    emptyText: "No SNPs within 10Kb",
	    cols: [
	        {title: "accession", data: "name",
	         render: Render.snp_link },
	        {title: "distance", data: "distance",
	         render: Render.integer }
	    ],
            pageLength: 5,
	    order: [[1, "asc"]]
        }
    };
    if("hg19" == GlobalAssembly){
        ret = {...ret,
               tads: {
	           title: "Genes within TAD",
	           paging: true,
		   helpkey: "GenesWithinTAD",
	           info: false,
	           bFilter: true,
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
               re_tads: {
	           title: "Other cREs within TAD and <100 kb",
		   helpkey: "cREsWithinTAD",
	           paging: true,
	           info: false,
	           bFilter: true,
                   bLengthChange: true,
	           emptyText: "No cREs within TAD with 100 Kb",
	           cols: [
	               {title: "accession", data: "accession",
	                render: Render.relink(GlobalAssembly) },
	               {title: "distance", data: "distance",
                        render: Render.integer} ],
                   pageLength: 5,
	           order: [[1, "asc"]]
               }
        };
    }
    return ret;
};

export const TfIntersectionTable = () => ({
    "tf": {
	title: "TFs that bind this cRE",
        typ: IntersectingAssayTf,
	helpkey: "Intersecting_transcription_factors",
	cols: [
	    {title: "factor", data: "name",
	     render: Render.factorbook_link_tf },
	    {title: "# of experiments that support TF binding", data: "n",
	     render: Render.integerLink("tf") },
	    {title: "# experiments in total", data: "total",
	     render: Render.integer }],
	bFilter: true,
	order: [[1, "desc"]]
    },
    "histone": {
	title: "Histone Marks at this cRE",
	helpkey: "IntersectingHistoneMarks",
        typ: IntersectingAssayHistone,
	cols: [
	    {title: "mark", data: "name" },
	    //render: Render.factorbook_link_histone },
	    {title: "# of experiments that support histone modification", data: "n",
	     render: Render.integerLink("histone") },
	    {title: "# experiments in total", data: "total",
	     render: Render.integer }],
	bFilter: true,
	order: [[1, "desc"]]
    }
});

export const CistromeIntersectionTable = () => ({
    "tf": {
	title: "intersecting cistrome TF exps",
	eset: "cistrome",
        typ: IntersectingAssayTf,
	cols: [
	    {title: "factor", data: "name",
	     render: Render.factorbook_link_tf },
	    {title: "# of experiments that support TF binding", data: "n",
	     render: Render.integerLink("tf") },
	    {title: "# experiments in total", data: "total",
	     render: Render.integer }],
	bFilter: true,
	order: [[1, "desc"]]
    },
    "histone": {
	title: "intersecting cistrome histone mark exps",
        typ: IntersectingAssayHistone,
	eset: "cistrome",
	cols: [
	    {title: "mark", data: "name" },
	    //render: Render.factorbook_link_histone },
	    {title: "# of experiments that support histone modification", data: "n",
	     render: Render.integerLink("histone") },
	    {title: "# experiments in total", data: "total",
	     render: Render.integer }],
	bFilter: true,
	order: [[1, "desc"]]
    }
});
