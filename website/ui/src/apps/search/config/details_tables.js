import React from 'react';
import * as Render from '../../../common/zrenders';
import {commajoin} from '../../../common/utility';

import IntersectingAssayTf from '../components/intersecting_assay_tf';
import IntersectingAssayHistone from '../components/intersecting_assay_histone';

const fantomcat_link = (d) => (
	<a href={"http://fantom.gsc.riken.jp/cat/v1/#/genes/" + d}
    target="_blank">{d}</a>
);

const geneLink_list = (d) => (
    commajoin(d.split(", ").map(Render.geneLink))
);

export const TopTissuesTables = (globals, assembly) => ({
    promoter: {
	title: "H3K4me3 Z-scores",
	helpkey: "H3K4me3Z-scores",
	cols: [
	    {title: "cell type", data: "ct", className: "dt-right",
	     render: Render.cell_type(globals)},
	    {title: "H3K4me3 and DNase", data: "two",
	     render: Render.z_score},
	    {title: "H3K4me3 only", data: "one",
	     render: Render.z_score}
	],
	sortCol: ["one", false],
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
	     render: Render.cell_type(globals)},
	    {title: "H3K27ac and DNase", data: "two",
	     render: Render.z_score},
	    {title: "H3K27ac only", data: "one",
	     render: Render.z_score}
	],
	sortCol: ["one", false],
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
	     render: Render.cell_type(globals)},
	    {title: "CTCF and DNase", data: "two",
             render: Render.z_score},
	    {title: "CTCF only", data: "one",
	     render: Render.z_score
	    }
	],
	sortCol: ["one", false],
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
	     render: Render.cell_type(globals)},
	    {title: "Z-score", data: "one",
	     render: Render.z_score
	    }
	],
	sortCol: ["one", false],
	pageLength: 5,
	paging: true,
	bar_graph: false, //GlobalAssembly != "hg19",
        bLengthChange: true,
	bFilter: true,
	rank_f: (d) => (Math.log(d["one"]))
    }
});

export const OrthologTable = (globals, assembly) => ({
    ortholog: {
	title: "",
	paging: false,
	info: false,
	bFilter: true,
	bLengthChange: false,
	emptyText: "No orthologous cRE identified",
	cols: [
	    {title: "accession", data: "accession", className: "dt-right",
             render: Render.relink(assembly === "mm10" ? "hg19" : "mm10")},
	    {title: "chromosome", data: "chrom", className: "dt-right"},
	    {title: "start", data: "start", render: Render.integer},
	    {title: "end", data: "stop", render: Render.integer},
	    {title: "overlap", data: "overlap", render: Render.bp}
	],
	sortCol: ["overlap", false]
    }
});

export const FantomCatTable = (globals, assembly, actions) => ({
    fantom_cat_twokb: {
	title: "Intersecting FANTOM CAT RNAs (cRE within 2kb of RNA TSS)",
	cols: [
	    {title: "FANTOM CAT RNA accession", data: "geneid", 
	     render: fantomcat_link},
	    {title: "aliases", data: "other_names",
	     render: geneLink_list},
	    {title: "RNA class", data: "geneclass"},
	    {title: "chr", data: "chrom"},
	    {title: "start", data: "start", render: Render.integer},
	    {title: "end", data: "stop", render: Render.integer},
	    {title: "strand", data: "strand"},
	    {title: "", data: null,
	     className: "browser",
	     targets: -1, orderable: false,
	     defaultContent: Render.browser_buttons(["UCSC"])
	    }
	],
	onTdClick: (td, rowdata) => {
            if (td.indexOf("browser") !== -1){
		const args = {
		    title: rowdata.geneid + " (TSS +/- 2kb)",
		    start: rowdata.start - 2000,
		    len: 4000,
		    chrom: rowdata.chrom
		};
		actions.showGenomeBrowser(args, "UCSC", "FantomCAT");
	    }
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
	    {title: "FANTOM CAT RNA accession", data: "geneid", 
	     render: fantomcat_link},
	    {title: "aliases", data: "other_names",
	     render: geneLink_list},
	    {title: "RNA class", data: "geneclass", className: "dt-right"},
	    {title: "chr", data: "chrom", className: "dt-right"},
	    {title: "start", data: "start", render: Render.integer},
	    {title: "end", data: "stop", render: Render.integer},
	    {title: "strand", data: "strand", className: "dt-right"},
	    {title: "", data: null,
	     className: "browser",
	     targets: -1, orderable: false,
	     defaultContent: Render.browser_buttons(["UCSC"]) }
	],
	onTdClick: (td, rowdata) => {
            if (td.indexOf("browser") !== -1){
		const args = {
		    title: rowdata.geneid,
		    start: rowdata.start,
		    len: rowdata.stop - rowdata.start,
		    chrom: rowdata.chrom
		};
		actions.showGenomeBrowser(args, "UCSC", "FantomCAT");
	    }},
	order: [[3, "asc"], [4, "asc"], [5, "asc"]],
	pagLength: 5,
	paging: true,
	bar_graph: false,
	bLengthChange: true,
	bFilter: true
    }
});

export const NearbyGenomicTable = (globals, assembly) => {
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
	         render: Render.geneLink},
	        {title: "distance", data: "distance",
	         render: Render.integer}],
            pageLength: 5,
	    sortCol: ["distance", true]
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
	         render: Render.relink(assembly) },
	        {title: "distance", data: "distance",
	         render: Render.integer } ],
            pageLength: 5,
	    sortCol: ["distance", true]
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
	         render: Render.snp_link(assembly) },
	        {title: "distance", data: "distance",
	         render: Render.integer }
	    ],
            pageLength: 5,
	    sortCol: ["distance", true]
        }
    };
    if("hg19" === assembly){
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
	                render: Render.geneLink},
	               //{title: "coordinates", data: "coordinates"}
                   ],
                   pageLength: 5,
		   sortCol: ["name", true]
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
	                render: Render.relink(assembly) },
	               {title: "distance", data: "distance",
                        render: Render.integer} ],
                   pageLength: 5,
		   sortCol: ["distance", true]
               }
        };
    }
    return ret;
};

export const TfIntersectionTable = (globals, assembly) => ({
    "tf": {
	title: "TFs that bind this cRE",
        typ: IntersectingAssayTf,
	helpkey: "Intersecting_transcription_factors",
	cols: [
	    {title: "factor", data: "name",
	     render: Render.factorbook_link_tf(assembly) },
	    {title: "# of experiments that support TF binding", data: "n",
	     render: Render.integerLink("tf") },
	    {title: "# experiments in total", data: "total",
	     render: Render.integer }],
	bFilter: true,
	sortCol: ["n", false]
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
	sortCol: ["n", false]
    }
});

export const CistromeIntersectionTable = (globals, assembly) => ({
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
	sortCol: ["n", false]
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
	sortCol: ["n", false]
    }
});

export const LinkedGenesTable = (globals, assembly) => ({
    "linked_genes": {
	title: "Linked Genes",
	emptyText: "No linked genes predicted",
	cols: [{ title: "gene", data: "gene",
		 render: Render.geneLink
	       },{ title: "biosample", data: "celltype",
		   //render: Render.support
	       },{ title: "supporting exp", data: "method",
		   //render: Render.support
	       },{ title: "based on", data: "dccaccession",
		   render: Render.gwasLink
		 }],
    }
});

