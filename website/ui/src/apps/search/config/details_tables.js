import React from 'react';
import * as Render from '../../../common/zrenders';
import {commajoin} from '../../../common/utility';

import {dnase_tablecols} from '../../../common/components/nucleosomeoccupancy';
import {histone_tablecols} from '../../../common/components/histonemodification';
import {interactions_tablecols} from '../../../common/components/interactions';
import {tf_tablecols} from '../../../common/components/tfbinding';
import {cDHS_tablecols} from '../../../common/components/cdhs';

import IntersectingAssayTf from '../components/intersecting_assay_tf';
import IntersectingAssayHistone from '../components/intersecting_assay_histone';

const fantomcat_link = (d) => (
    <a href={"http://fantom.gsc.riken.jp/cat/v1/#/genes/" + d}
       target="_blank">{d}</a>
)

const geneLink_list = (d) => (
    commajoin(d.split(", ").map(Render.geneLink))
)

const _vistalink = id => (
    <a href={'https://enhancer.lbl.gov/cgi-bin/imagedb3.pl?form=presentation&show=1&experiment_id=' + id.substring(2) + '&organism_id=' + (id[0] === 'm' ? '2' : '1')}
      target="_blank">{id}</a>
);

export const TopTissuesTables = (globals, assembly) => ({
    iranks: {
	title: "Cell type agnostic classification",
	helpkey: "",
	cols: [
	    {title: "Cell Type", data: "title", className: "dt-right"},
	    {title: "DNase max-Z", data: "dnase",
	     render: Render.z_score
	    },
	    {title: "H3K4me3 max-Z", data: "h3k4me3",
	     render: Render.z_score
	    },
	    {title: "H3K27ac max-Z", data: "h3k27ac",
	     render: Render.z_score
	    },
	    {title: "CTCF max-Z", data: "ctcf",
	     render: Render.z_score
	    },
	    {
		title: "Group", data: "group",
		render: Render.ctgroup
	    }
	],
	sortCol: ["dnase", false],
	pageLength: 1,
	paging: false,
	bLengthChange: false,
	bFilter: false,
	rank_f: d => Math.log(d["dnase"])
    },
    typea: {
	title: "Classification in Type A biosamples (all four marks available)",
	helpkey: "",
	cols: [
	    {title: "cell type", data: "ct", className: "dt-right",
	     render: Render.cell_type(globals)},
	    {title: "DNase Z-score", data: "dnase",
	     render: Render.z_score
	    },
	    {title: "H3K4me3 Z-score", data: "h3k4me3",
	     render: Render.z_score
	    },
	    {title: "H3K27ac Z-score", data: "h3k27ac",
	     render: Render.z_score
	    },
	    {title: "CTCF Z-score", data: "ctcf",
	     render: Render.z_score
	    },
	    {
		title: "Group", data: "group",
		render: Render.ctgroup
	    }
	],
	sortCol: ["dnase", false],
	pageLength: 10,
	paging: true,
        bLengthChange: true,
	bFilter: true,
	rank_f: (d) => (Math.log(d["dnase"]))
    },
    withdnase: {
	title: "Classification in Type B and D biosamples (DNase-seq available)",
	helpkey: "",
	cols: [
	    {title: "cell type", data: "ct", className: "dt-right",
	     render: Render.cell_type(globals)},
	    {title: "DNase Z-score", data: "dnase",
	     render: Render.z_score
	    },
	    {title: "H3K4me3 Z-score", data: "h3k4me3",
	     render: Render.z_score
	    },
	    {title: "H3K27ac Z-score", data: "h3k27ac",
	     render: Render.z_score
	    },
	    {title: "CTCF Z-score", data: "ctcf",
	     render: Render.z_score
	    },
	    {
		title: "Group", data: "group",
		render: Render.ctgroup
	    }
	],
	sortCol: ["dnase", false],
	pageLength: 10,
	paging: true,
        bLengthChange: true,
	bFilter: true,
	rank_f: (d) => (Math.log(d["dnase"]))
    },
    typec: {
	title: "Classification in Type C biosamples (DNase-seq not available)",
	helpkey: "",
	cols: [
	    {title: "cell type", data: "ct", className: "dt-right",
	     render: Render.cell_type(globals)},
	    {title: "H3K4me3 Z-score", data: "h3k4me3",
	     render: Render.h3k4me3_z_score
	    },
	    {title: "H3K27ac Z-score", data: "h3k27ac",
	     render: Render.h3k27ac_z_score
	    },
	    {title: "CTCF Z-score", data: "ctcf",
	     render: Render.ctcf_z_score
	    }
	],
	sortCol: ["ct", false],
	pageLength: 10,
	paging: true,
        bLengthChange: true,
	bFilter: true
    }
});

export const OrthologTable = (globals, assembly, uuid) => ({
    ortholog: {
	title: "homologous cCREs in " + (assembly === "mm10" ? " human (GRCh38)" : "mouse (mm10)"),
	paging: false,
	info: false,
	bFilter: true,
	bLengthChange: false,
	emptyText: "No homologous cCREs have been identified for this cCRE.",
	cols: [
	    {title: "accession", data: "accession", render: Render.relink(assembly === "mm10" ? "GRCh38" : "mm10", "")},
	    {title: "chromosome", data: "chrom", className: "dt-right"},
	    {title: "start", data: "start", render: Render.integer},
	    {title: "end", data: "stop", render: Render.integer}
	],
	sortCol: ["start", false]
    },
    hg19: {
	title: "homologous cCREs in hg19",
	paging: false,
	info: false,
	bFilter: true,
	bLengthChange: false,
	emptyText: "No homologous cCREs have been identified for this cCRE.",
	cols: [
	    {title: "accession", data: "accession", className: "dt-right",
             render: Render.exrelink("hg19", uuid)},
	    {title: "chromosome", data: "chrom", className: "dt-right"},
	    {title: "start", data: "start", render: Render.integer},
	    {title: "end", data: "stop", render: Render.integer}
	],
	sortCol: ["start", false]
    }
});

export const FantomCatTable = (globals, assembly, actions) => ({
    fantom_cat_twokb: {
	title: "Intersecting FANTOM CAT RNAs (cCRE within 2kb of RNA TSS)",
	emptyText: "This cCRE is not proximal to any FANTOM CAT RNA TSSs",
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
	bLengthChange: true,
	bFilter: true
    },
    fantom_cat: {
	title: "Intersecting FANTOM CAT RNAs (cCRE within entire RNA body)",
	emptyText: "This cCRE does not intersect any FANTOM CAT RNAs",
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
	bLengthChange: true,
	bFilter: true
    },
    enhancers: {
	"title": "Intersecting FANTOM enhancers (permissive, FANTOM5 Phases 1 and 2)",
	emptyText: "This cCRE does not intersect any FANTOM enhancers",
	cols: [
	    {title: "chr", data: "chr", className: "dt-right"},
	    {title: "start", data: "start", render: Render.integer},
	    {title: "end", data: "stop", render: Render.integer},
	    {title: "score", data: "score"},
	    {title: "", data: null,
	     className: "browser",
	     targets: -1, orderable: false,
	     defaultContent: Render.browser_buttons(["UCSC"]) }
	],
	onTdClick: (td, rowdata) => {
            if (td.indexOf("browser") !== -1){
		const args = {
		    title: rowdata.chr + ":" + rowdata.start + "-" + rowdata.stop,
		    start: rowdata.start,
		    len: rowdata.stop - rowdata.start,
		    chrom: rowdata.chr
		};
		actions.showGenomeBrowser(args, "UCSC", "FantomCAT");
	    }},
	order: [[3, "asc"], [4, "asc"], [5, "asc"]],
	pageLength: 5,
	paging: true,
	bFilter: true,
	bLengthChange: true
    },
    cage: {
	"title": "Intersecting FANTOM CAGE peaks (robust, FANTOM5 Phases 1 and 2)",
	emptyText: "This cCRE does not intersect any FANTOM CAGE peaks",
	cols: [
	    {title: "chr", data: "chr", className: "dt-right"},
	    {title: "start", data: "start", render: Render.integer},
	    {title: "end", data: "stop", render: Render.integer},
	    {title: "strand", data: "strand", className: "dt-right"},
	    {title: "score", data: "score"},
	    {title: "TSS start", data: "tssstart", render: Render.integer},
	    {title: "TSS end", data: "tssstop", render: Render.integer},
	    {title: "", data: null,
	     className: "browser",
	     targets: -1, orderable: false,
	     defaultContent: Render.browser_buttons(["UCSC"]) }
	],
	onTdClick: (td, rowdata) => {
            if (td.indexOf("browser") !== -1){
		const args = {
		    title: rowdata.chr + ":" + rowdata.start + "-" + rowdata.stop,
		    start: rowdata.start,
		    len: rowdata.stop - rowdata.start,
		    chrom: rowdata.chr
		};
		actions.showGenomeBrowser(args, "UCSC", "FantomCAT");
	    }},
	order: [[3, "asc"], [4, "asc"], [5, "asc"]],
	pageLength: 5,
	paging: true,
	bFilter: true,
	bLengthChange: true
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
	    title: "Nearby cCREs",
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
	    csv: true,
	    emptyText: "No SNPs within 10Kb",
	    cols: [
	        {title: "accession", data: "name",
	         render: Render.snp_link(assembly) },
	        {title: "distance", data: "distance",
	         render: Render.integer }
	    ],
            pageLength: 5,
	    sortCol: ["distance", true]
        },
	vistaids: {
	    title: "Intersecting VISTA enhancers",
	    paging: true,
	    info: false,
	    bFilter: true,
	    bLengthChange: true,
	    csv: false,
	    emptyText: "No VISTA enhancers intersect this cCRE",
	    cols: [
		{title: "VISTA ID", data: "vid", render: _vistalink}
	    ],
	    pageLength: 5,
	    sortCol: ["vid", true]
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
	           title: "Other cCREs within TAD and <100 kb",
		   helpkey: "cREsWithinTAD",
	           paging: true,
	           info: false,
	           bFilter: true,
                   bLengthChange: true,
	           emptyText: "No cCREs within TAD with 100 Kb",
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
	title: "TFs that bind this cCRE",
        typ: IntersectingAssayTf,
	helpkey: "Intersecting_transcription_factors",
	emptyText: "No ENCODE TF ChIP-seq peaks intersect this cCRE",
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
	title: "Histone Marks at this cCRE",
	helpkey: "IntersectingHistoneMarks",
        typ: IntersectingAssayHistone,
	emptyText: "No ENCODE histone mark ChIP-seq peaks intersect this cCRE",
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
	     render: Render.factorbook_link_tf(assembly) },
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
	emptyText: "No linked genes have been identified for this cCRE using ChIA-PET or eQTL data",
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

export const FunctionalValidationTable = (globals, assembly) => ({
    "functional_validation": {
	title: "Functional Validation",
	emptyText: "No functional validation data matches this cCRE",
	cols: [{ title: "biosample(s)", data: "tissues", render: d => d.join(", ")  },
	       { title: "assay", data: "cCRE", render: _ => "transgenic reporter" },
       	       { title: "start", data: "start", render: Render.integer },
	       { title: "length", data: "length", render: x => Render.integer(x) + " bp" },
	       { title: "overlap", data: "overlap", render: x => Render.integer(x) + " bp" },
	       { title: "lab", data: "cCRE", render: _ => "Penacchio" },
	       { title: "VISTA ID", data: "accession"}],
    }
});

export const GroundLevelTables = (globals, assembly) => ({
    "cdhs": {
	title: "cDHSs",
	emptyText: "This cCRE does not intersect any cDHSs.",
	cols: cDHS_tablecols
    },
    "dnase": {
	title: "DNase Peaks",
	emptyText: "No nucleosome-free regions intersect this cCRE.",
	cols: dnase_tablecols
    },
    "histone": {
	title: "Histone Modifications",
	emptyText: "No histone mark peaks intersect this cCRE.",
	cols: histone_tablecols
    },
    "tf": {
	title: "Transcription Factor Binding Sites",
	emptyText: "No TF ChIP-seq peaks intersect this cCRE.",
	cols: tf_tablecols
    },
    "3dinteractions": {
	title: "Long Distance Interactions from ChIA-PET",
	emptyText: "No long distance interactions intersect this cCRE.",
	cols: interactions_tablecols
    }
});
    
