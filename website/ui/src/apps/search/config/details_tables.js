import * as Render from '../../../common/renders'

import IntersectingAssayTf from '../components/intersecting_assay_tf'
import IntersectingAssayHistone from '../components/intersecting_assay_histone'

export const TopTissuesTables = () => ({
    promoter: {
	title: "H3K4me3 Z-scores",
	helpkey: "h3k4me3z",
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
	helpkey: "h3k27acz",
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
	helpkey: "ctcfz",
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
	helpkey: "dnasez",
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

export const NearbyGenomicTable = () => {

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

    let ret = {
        nearby_genes: {
	    title: "Nearby Genes",
	    helpkey: "nearbygenes",
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
	    helpkey: "nearbycres",
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
	    order: [[1, "asc"]],
	    onTdClick: (actions) => (i, d) => { actions.showReDetail(d.name)}
        },
        overlapping_snps: {
	    title: "Nearby SNPs",
	    helpkey: "nearbysnps",
	    paging: true,
	    info: false,
	    bFilter: true,
            bLengthChange: true,
	    emptyText: "No SNPs within 10Kb",
	    cols: [
	        {title: "accession", data: "name",
	         render: Render.snp_link },
	        {title: "distance", data: "distance",
	         render: Render.integer },
		{title: "", data: null,
		 className: "browser",
		 targets: -1, orderable: false,
		 defaultContent: Render.browser_buttons(["UCSC"]) }
	    ],
	    onTdClick: (td, rowdata) =>
                table_click_handler(td, rowdata),
	    onButtonClick: (actions) => (td, rowdata) =>
                button_click_handler(td, rowdata, actions),
            pageLength: 5,
	    order: [[1, "asc"]]
        }
    };
    if("hg19" == GlobalAssembly){
        ret = {...ret,
               tads: {
	           title: "Genes within TAD",
	           paging: true,
		   helpkey: "geneswithintad",
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
		   helpkey: "creswithintad",
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
	           order: [[1, "asc"]],
	           onTdClick: (actions) => (i, d) => {
                       actions.showReDetail(d.name)}
               }
        };
    }
    return ret;
};

export const TfIntersectionTable = () => ({
    "tf": {
	title: "TFs that bind this cRE",
        typ: IntersectingAssayTf,
	helpkey: "itfs",
	cols: [
	    {title: "factor", data: "name",
	     render: Render.factorbook_link_tf },
	    {title: "# experiments", data: "n",
	     render: Render.integerLink("tf") },
	    {title: "# experiments in total", data: "total",
	     render: Render.integer }],
	bFilter: true,
	order: [[1, "desc"]]
    },
    "histone": {
	title: "Histone Marks at this cRE",
	helpkey: "ihms",
        typ: IntersectingAssayHistone,
	cols: [
	    {title: "mark", data: "name" },
	    //render: Render.factorbook_link_histone },
	    {title: "# experiments", data: "n",
	     render: Render.integerLink("histone") },
	    {title: "# experiments in total", data: "total",
	     render: Render.integer }],
	bFilter: true,
	order: [[1, "desc"]]
    }
});
