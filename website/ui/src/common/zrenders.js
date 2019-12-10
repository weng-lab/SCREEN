import React from 'react';
import {Button, ButtonGroup} from 'react-bootstrap';

import {toParams, commajoin} from './utility';
import * as ApiClient from './api_client';
import * as Urls from './urls';

export const relink = (assembly, uuid) => (v) => (
    <a href={"/search/?" + toParams({assembly, q: v, uuid})} target="_blank">
	{v}
    </a>
);

export const exrelink = (assembly, uuid) => (v) => (
    <a href={"http://screen-v10.umassmed.edu/search?" + toParams({ assembly, q: v, uuid })} target="_blank">
	{v}
    </a>
);

export const ctgroup = group => {
    group = group.split(',')[0];
    if (group === "pELS") return <span style={{color: "#ffcd00"}}><strong>proximal enhancer-like signature</strong></span>;
    if (group === "dELS") return <span style={{color: "#ffcd00"}}><strong>distal enhancer-like signature</strong></span>;
    if (group === "PLS") return <span style={{color: "#ff0000"}}><strong>promoter-like signature</strong></span>;
    if (group === "DNase-H3K4me3") return <span style={{color: "#ffaaaa"}}><strong>DNase-H3K4me3</strong></span>;
    if (group === "ctcf") return <span style={{color: "#00b0f0"}}><strong>CTCF bound</strong></span>;
    if (group === "ylowdnase") return <span style={{color: "#8c8c8c"}}><strong>low DNase</strong></span>;
    if (group === "zunclassified") return <span style={{color: "#8c8c8c"}}><strong>unclassified</strong></span>;
    return <span style={{color: "#06da93"}}><strong>DNase only</strong></span>;
};

export const snp_link = (assembly) => (d) => {
    var url = "http://ensembl.org/Homo_sapiens/Variation/Explore";
    if("mm10" === assembly){
        url = "http://ensembl.org/Mus_musculus/Variation/Explore";
    }
    return <a href={url + "?vdb=variation;v=" + d} target="_blank" key={d}>{d}</a>;
}

export const snpLinks = (assembly) => (snps) => ( commajoin(snps.map(snp_link(assembly))) )

export const integerLink = (href) => (d) => {
    return <a href={'#' + href}>{d}</a>;
}

export const toSciNot = (d) => {
    if(d < 0.01){
	return d.toExponential(1);
    }
    return Math.round(d * 100) / 100;
}

export const numWithCommas = (x) => {
    // http://stackoverflow.com/a/2901298
    var parts = x.toString().split(".");
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return parts.join(".");
}

export const integer = (d) => (d === 1e12 ? "" : numWithCommas(d.toFixed(0)))
export const real = (d) => (d.toFixed(2))
export const z_score = (d) => (d === -11.0 || d === '--' || d === undefined ? "--" : d.toFixed(2));
export const dnase_z_score = (d) => (d === -11.0 || d === '--' || d === undefined ? "--" : (d > 1.64 ? <strong><span style={{ color: "#06da93" }}>{d.toFixed(2)}</span></strong> : d.toFixed(2)));
export const h3k4me3_z_score = (d) => (d === -11.0 || d === '--' || d === undefined ? "--" : (d > 1.64 ? <strong><span style={{ color: "#ff0000" }}>{d.toFixed(2)}</span></strong> : d.toFixed(2)));
export const h3k27ac_z_score = (d) => (d === -11.0 || d === '--' || d === undefined ? "--" : (d > 1.64 ? <strong><span style={{ color: "#ffcd00" }}>{d.toFixed(2)}</span></strong> : d.toFixed(2)));
export const ctcf_z_score = (d) => (d === -11.0 || d === '--' || d === undefined ? "--" : (d > 1.64 ? <strong><span style={{ color: "#00b0f0" }}>{d.toFixed(2)}</span></strong> : d.toFixed(2)));
export const cell_type = (globals) => (ct) => (globals.byCellType[ct][0]["name"]);

export const support = (support) => (
    ("eqtls" in support ? support.eqtls.length : 0) + ("chiapet" in support ?
						       support.chiapet.length : 0));

export const len = (list) => (list ? list.length : 0);
export const supporting_cts = (list) => {
    if (list === null) {
	return "";
    }
    let map = {};
    for(let x of list){
	if (!(x["cell-type"] in map)) {
	    map[x["cell-type"]] = 0;
	}
	++map[x["cell-type"]];
    }
    return Object.keys(map).map((k) => (k + " (" + map[k] + ")")).join(", ");
};

export const browser_buttons = (names) => {
    const content = names.map((name) => (
	<button
	    type="button"
	    key={name}
	    className="btn btn-default btn-xs">
	    {name}
	</button>));
    return (
	<div className="btn-group" role="group">
	    {content}
	</div>);
}

export const browser_button = (name, onClick) => {
    return (
	    <ButtonGroup>
	    <Button bsSize="xsmall" onClick={onClick}>{name}</Button>
	    </ButtonGroup>);
}

export const cart_img = (rmv, src_only) => {
    const src = ApiClient.StaticUrl("/re_cart." + (rmv ? "rmv" : "add") + ".png");
    if(src_only){
        return src;
    }
    const title = (rmv ? "remove cCRE from cart" : "add cCRE to cart");
    return <img className="rowCart" src={src} title={title} alt="cart" />;
}

export const popup = (p, c) => (
    <span data-toggle="tooltip" data-placement="top" title={p}>
	{c}
    </span>
)

export const creLinkPop = (accession, type, full, meta) => (
    popup("Click for cCRE details")
)

export const geLink = (assembly, gene, uuid) => ("/geApp/?" + toParams({assembly, gene, uuid}))
export const deLink = (assembly, gene, uuid) => ("/deApp/?" + toParams({assembly, gene, uuid}))

export const geDeButton = (assembly, accession, uuid) => (d) => {
    const _d = d.replace(/\./g, "%2e");
    const ge = <a href={geLink(assembly, _d, uuid)} target={"_blank"}
	       key={[accession, d, "ge"]}>{d}</a>;
    if("mm10" !== assembly){
        return ge;
    }
    const de = <a href={deLink(assembly, _d, uuid)} target={"_blank"}
		  key={[accession, d, "de"]}
		  style={{paddingLeft: "4px"}}>&Delta;</a>;
    return [ge, de];
};

export const geneDeLinks = (assembly, uuid) => (genesallpc) => {
    const accession = genesallpc.accession;
    const all = commajoin(genesallpc.all.map(geDeButton(assembly, accession, uuid)));
    const pc = commajoin(genesallpc.pc.map(geDeButton(assembly, accession, uuid)));
    return ["pc: ", pc,
	    <br key={accession}/>,
	    "all: ", all];
    }

export const dccImg = () => (
	<img src={ApiClient.StaticUrl("/encode/pennant-encode.png")}
    alt="DCC logo" width="20" />);

export const dccLink = (expID) => {
    const url = 'https://www.encodeproject.org/experiments/' + expID;
    const img = dccImg();
    return <a target="_blank" href={url}>{img}</a>;
}

export const dccLinkFile = (fileID) => {
    const url = 'https://www.encodeproject.org/' + fileID;
    const img = dccImg();
    return <a target="_blank" href={url}>{img} ({fileID})</a>;
}

export const gwasLink = (ref) => {
    if (!ref) { return ''; }
    if(ref.startsWith("ENCFF")){
	return dccLink(ref);
    }
    if (ref.startsWith("ENCSR")) {
	return dccLink(ref);
    }
    if(ref.startsWith("PMID:") || true){
	ref = ref.replace('PMID:', '');
	const url = 'https://www.ncbi.nlm.nih.gov/pubmed/' + ref;
	const img = <img src={ApiClient.StaticUrl("/logo_pubmed.jpg")}
			 alt="DCC logo" height="20" />;
	return <a target="_blank" href={url}>{img} (PMID {ref})</a>;
    }
    return ref;
}

export const dccLinkCtGroupExpIDs = (accs) => {
    let q = accs.join("&accession=");
    const url = 'https://www.encodeproject.org/search/?accession=' + q;
    const img = dccImg();
    return <a target="_blank" href={url}>{img}</a>;
}

export const dccLinkCtGroup = (globals, ctn) => {
    const accs = globals.byCellType[ctn].map((info) => (info.expID));
    const q = accs.join("&accession=");
    const url = 'https://www.encodeproject.org/search/?accession=' + q;
    const img = dccImg();
    return <a target="_blank" href={url}>{img}</a>;
}

export const dccLinkCtGroupCus = (globals, ctn, content) => {
    const accs = globals.byCellType[ctn].map((info) => (info.expID));
    const q = accs.join("&accession=");
    const url = 'https://www.encodeproject.org/search/?accession=' + q;
    return <a target="_blank" href={url}>{content}</a>;
}

export const dccLinkAndIconSplit = (expAndFileID) => {
    const expID = expAndFileID.split(' / ')[0];
    const url = 'https://www.encodeproject.org/experiments/' + expID;
    const img = <img src={ApiClient.StaticUrl("/encode/pennant-encode.png")}
    alt="ENCODE logo" style={{paddingLeft: "10px"}} />;
    return <a target="_blank" href={url}>{expAndFileID}{img}</a>;
}

export const cistromeLink = (acc) => (
    <a href={"https://www.ncbi.nlm.nih.gov/geo/query/acc.cgi?acc=" + acc} target='_blank'>{acc}</a>);

export const factorbook_link_tf = (assembly) => (d) => {
    const lookup = {"GRCh38": "human",
		    "hg19": "human",
		    "mm10": "mouse"};
    const url = "http://www.factorbook.org/" + lookup[assembly] + "/chipseq/tf/" + d;
    return <a href={url} target="_blank">{d}</a>;
}

const factorbook_histones = [
    "H2AFZ",
    "H3K27ac",
    "H3K27me3",
    "H3K36me3",
    "H3K4me1",
    "H3K4me2",
    "H3K4me3",
    "H3K79me2",
    "H3K9ac",
    "H3K9me1",
    "H3K9me2",
    "H3K9me3",
    "H4K20me1"
];

export const factorbook_link_histone = (d) => (
    factorbook_histones.includes(d)
    ? '<a href="http://factorbook.org/human/chipseq/histone/' + d + '" target="_blank">' + d.replace(/F/g, ".") + '</a>'
    : d.replace(/F/g, ".")
);

export const geneLink = (d) => (
    <em key={d}>
	<a href={Urls.geneCardLink(d)}
	   target="_blank">{d}</a>
    </em>);

export const position = (pos) => (pos.chrom + ":" + pos.start + "-" + pos.end);
export const bp = (v) => (v + " bp");

export const nul = (d) => ('')

export const tabTitle = (c) => (
    <span className="text-center">
	{c[0]}<br />{c[1]}
    </span>);

export const upperCase = (d) => (d.toUpperCase())

export const searchLink = (data, uuid) => (approved_symbol) => {
    const d = {q: approved_symbol,
	       uuid,
	       assembly: data.assembly};
    const params = toParams(d);
    const url = "/search/?" + params;
    return <a href={url}>{approved_symbol}</a>;
}

export const assayIcon = (globals) => (ctn) => {
    let colors = globals.colors.cREs;

    let assays = globals.byCellType[ctn].map((a) => (a.assay));
    assays.sort();
    let w = 12;
    let fw = 2 * w + 4;
    let rect = (x, y, color) => (
	<rect x={x} y={y} width={w} height={w} style={{fill : color}} />
    )
    let line = (x1, y1, x2, y2) => (
	<line x1={x1} y1={y1} x2={x2} y2={y2}
	      style={{strokeWidth: 1, stroke: "black"}} />
    )
    let border = () => (
	<rect x={0} y={0} width={fw} height={fw}
	      style={{fill: "white", strokeWidth: 1, stroke: "black"}} />
    )

    let e = (
	<span className={"text-nowrap"}>
	    <svg width={fw} height={fw}>
		<g>
		    {border()}
		    {line(w+2, 0, w+2, fw)}
		    {line(0, w+2, fw, w+2)}
		    {assays.indexOf("DNase") > -1 &&
		     rect(1, 1, colors.DNase)}
		    {assays.indexOf("H3K27ac") > -1  &&
		     rect(1, w+3, colors.H3K27ac)}
		    {assays.indexOf("H3K4me3") > -1  &&
		     rect(w+3, 1, colors.H3K4me3)}
		    {assays.indexOf("CTCF") > -1  &&
		     rect(w+3, w+3, colors.CTCF)}
  		</g>
	    </svg>
	</span>);
    let title = assays.join(", ");
    let c = dccLinkCtGroupCus(globals, ctn, e);
    return popup(title, c);
}

export const creGroupIcon = (globals, creGroup) => {
    let colors = globals.colors.cREs;
    let lookupTitle = {'C' : "CTCF-only",
		       'E' : "Enhancer-like",
		       'P' : "Promoter-like"};
    let lookupColor = {'C' : colors.CTCF,
		       'E' : colors.H3K27ac,
		       'P' : colors.H3K4me3}

    let w = 18;
    let fw = w + 2;
    let rect = (x, y, color) => (
	<rect x={x} y={y} width={w} height={w} style={{fill : color}} />
    )
    let border = () => (
	<rect x={0} y={0} width={fw} height={fw}
	      style={{fill: "white", strokeWidth: 1, stroke: "black"}} />
    )

    let e = (
	<span className={"text-nowrap"}>
	    <svg width={fw} height={fw}>
		<g>
		    {border()}
		    {rect(1, 1, lookupColor[creGroup])}
  		</g>
	    </svg>
	</span>);
    let title = lookupTitle[creGroup];
    return popup(title, e);
}

export const sctGroupIconLegend = (globals, creGroup) => {
    let colors = globals.colors.cREs;
    let lookupTitle = {'C' : "High CTCF",
		       'E' : "High H3K27ac",
		       'P' : "High H3K4me3",
		       'D' : "High DNase",
		       'I' : "Z-score < 1.64",
		       'U' : "No data" };
    let lookupColor = {'C' : colors.CTCF,
		       'E' : colors.H3K27ac,
		       'P' : colors.H3K4me3,
		       'D' : colors.DNase,
		       'I' : colors.Inactive,
		       'U' : colors.NoData}
    let w = 12;
    let h = 9;
    let fw = w + 2;
    let fh = h + 2;
    let rect = (x, y, color) => (
	<rect x={x} y={y} width={w} height={h} style={{fill : color}} />
    )
    let border = () => (
	<rect x={0} y={0} width={fw} height={fh}
	      style={{fill: "white", strokeWidth: 1, stroke: "black"}} />
    )

    let e = (
	<span className={"text-nowrap"}>
	    <svg width={fw} height={fh}>
		<g>
		    {border()}
		    {rect(1, 1, lookupColor[creGroup])}
  		</g>
	    </svg>
	</span>);
    let title = lookupTitle[creGroup];
    return (
	<span>
	    {e}{" "}
	    <small>{title}</small>
	</span>);
}

export const concordantStar = (concordant) => {
    if(concordant){
	return (<span className="glyphicon glyphicon-star concordantStar"
		      aria-hidden="true"></span>);
    }
    return "";
}

export const checkCt = (checked) => {
    return <input type={"checkbox"} checked={checked} />
}
export const checkRd = (checked) => {
    return <input type={"radio"} defaultChecked={checked} />
}

export const creTableAccessionBoxen = (globals, cre) => {
    let w = 12;
    let h = 9;
    let fw = 3 * w + 3;
    let fh = h + 2;
    let rect = (x, y, color) => (
	<rect x={x} y={y} width={w} height={h} style={{fill : color}} />
    )
    let line = (x1, y1, x2, y2) => (
	<line x1={x1} y1={y1} x2={x2} y2={y2}
	      style={{strokeWidth: 1, stroke: "black"}} />
    )
    let border = () => (
	<rect x={0} y={0} width={fw} height={fh}
	      style={{fill: "white", strokeWidth: 1, stroke: "black"}} />
    )
    let colors = globals.colors.cREs;

    let col = (val, c) => ( val > 1.64 ? c : colors.Inactive )

    let e = (
	<span className={"text-nowrap"}>
	    <svg width={fw} height={fh}>
		<g>
		    {border()}
		    {rect(1, 1, col(cre.k4me3max, colors.H3K4me3))}
		    {line(1*(w+1)-1, 0, 1*(w+1)-1, fh)}
		    {rect(w+1, 1, col(cre.k27acmax, colors.H3K27ac))}
		    {line(2*(w+1)-1, 0, 2*(w+1)-1, fh)}
		    {rect(2*w+2, 1, col(cre.ctcfmax, colors.CTCF))}
        	</g>
	    </svg>
	</span>);
    return e;
}

export const creTableAccessionProx = (cre) => {
    return cre.isproximal ? popup("Proximal", "P") :
	   popup("Distal", "D");
}

export const creTableAccession = (globals) => (cre, type, full, meta) => {
    return (
	<div>
	    {popup("Click for cCRE details", cre.accession)}
	    <br />
	    {popup("Concordant", concordantStar(cre.concordant))}&nbsp;
	    {creTableAccessionProx(cre)}&nbsp;
	    {creTableAccessionBoxen(globals, cre)}
	</div>);
}

export const creTableCellTypeSpecific = (globals) => (data) => {
    const w = 12;
    const h = 9;
    const fw = 4 * w + 4;
    const fh = h + 2;
    const rect = (x, y, color) => (
	<rect x={x} y={y} width={w} height={h} style={{fill : color}} />
    )
    const line = (x1, y1, x2, y2) => (
	<line x1={x1} y1={y1} x2={x2} y2={y2}
	      style={{strokeWidth: 1, stroke: "black"}} />
    )
    const border = () => (
	<rect x={0} y={0} width={fw} height={fh}
	      style={{fill: "white", strokeWidth: 1, stroke: "black"}} />
    )
    const colors = globals.colors.cREs;

    const col = (val, c) => {
	if(null === val){
	    return colors.NoData;
	}
	return val > 1.64 ? c : colors.Inactive;
    }

    const k = Object.entries(data).join('_');

    return (
	<span className={"text-nowrap"} key={k}>
	    <svg width={fw} height={fh}>
		<g>
		    {border()}
		    {rect(1, 1, col(data.dnase_zscore, colors.DNase))}
		    {line(1*(w+1)-1, 0, 1*(w+1)-1, fh)}
		    {rect(1*(w+1), 1, col(data.promoter_zscore, colors.H3K4me3))}
		    {line(2*(w+1)-1, 0, 2*(w+1)-1, fh)}
		    {rect(2*(w+1), 1, col(data.enhancer_zscore, colors.H3K27ac))}
		    {line(3*(w+1)-1, 0, 3*(w+1)-1, fh)}
		    {rect(3*(w+1), 1, col(data.ctcf_zscore, colors.CTCF))}
        	</g>
	    </svg>
	</span>);
}

export const titlegeneric = (e) => {
    return (
	<div>
	    <h3 className="creDetailsTitle">{e.title}</h3>
	    {"\u00A0"}{"\u00A0"}{"\u00A0"}
	    {e.chrom}:{numWithCommas(e.start)}-
	    {numWithCommas(e.start + e.len)}
	</div>);
};

export const creTitle = (globals, cre) => {
    const ct = cre.ctspecifc.ct;
    return (
	<div>
	    <h3 className="creDetailsTitle">{cre.accession}</h3>
	    {"\u00A0"}{"\u00A0"}{"\u00A0"}
	    {cre.chrom}:{numWithCommas(cre.start)}-
	    {numWithCommas(cre.start + cre.len)}
	    {'\u00A0'}{"\u00A0"}{"\u00A0"}
	    {concordantStar(cre.concordant)}
	    {'\u00A0'}{"\u00A0"}{"\u00A0"}
	    {creTableAccessionProx(cre)}
	    {'\u00A0'}{"\u00A0"}{"\u00A0"}
	    {creTableAccessionBoxen(globals, cre)}
	    {'\u00A0'}{"\u00A0"}{"\u00A0"}
	    {ct && [globals.byCellType[ct][0]["name"], ":\u00A0",
		    creTableCellTypeSpecific(globals)(cre.ctspecifc)]}
	</div>);
}

export const sctSorter = (data) => {
    let col = (val) => {
	if(null === val){
	    return 0;
	}
	return val; // > 1.64 ? 2 : 1;
    };
    let p = Math.pow(2, col(data.promoter_zscore)) * 100;
    let e = Math.pow(2, col(data.enhancer_zscore)) * 10;
    let c = Math.pow(2, col(data.ctcf_zscore)) * 1;
    return e + p + c;
}

export const accSorter = (data) => {
    let col = (val) => {
	if(null === val){
	    return 0;
	}
	return val; // > 1.64 ? 2 : 1;
    };
    let p = Math.pow(2, col(data.k4me3max)) * 100;
    let e = Math.pow(2, col(data.k27acmax)) * 10;
    let c = Math.pow(2, col(data.ctcfmax));
    return e + p + c;
}

export const rnaseq = (rnaexps) => {
    if(rnaexps){
        return (<span className="glyphicon glyphicon-ok"
		aria-hidden="true"></span>);
    }
    return <span></span>;
}
