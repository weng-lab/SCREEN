import React from 'react';

import {commajoin} from './utility';

export const relink = (assembly) => (v) => (
    <a href={"/search?assembly=" + assembly + "&q=" + v} target={'_blank'}>
	{v}
    </a>
);

export const snp_link = (assembly) => (d) => {
    var url = "http://ensembl.org/Homo_sapiens/Variation/Explore";
    if("mm10" === assembly){
        url = "http://ensembl.org/Mus_musculus/Variation/Explore";
    }
    return <a href={url + "?vdb=variation;v=" + d} target="_blank">{d}</a>;
}

export const snpLinks = (snps) => {
    return snps.map(snp_link).join(", ");
}

export const integerLink = (href) => (d) => {
    return <a href={'#' + href}>{d}</a>;
}

export const toSciNot = (d) => {
    if(d < 0.01){
	return d.toExponential(1);
    }
    return Math.round(d * 100) / 100;
}

export const integer = (d) => (d === 1e12 ? "" : d.toFixed(0))
export const real = (d) => (d.toFixed(2))
export const z_score = (d) => (d === -11.0 ? "--" : d.toFixed(2));
export const cell_type = (globals) => (ct) => (globals.byCellType[ct][0]["name"]);

export const support = (support) => (
    ("eqtls" in support ? support.eqtls.length : 0) + ("chiapet" in support ?
						       support.chiapet.length : 0));

export const len = (list) => (list ? list.length : 0);
export const supporting_cts = (list) => {
    if (list === null) {
	return "";
    }
    var map = {};
    for(let x of list){
	if (!(x["cell-type"] in map)) {
	    map[x["cell-type"]] = 0;
	}
	++map[x["cell-type"]];
    }
    return Object.keys(map).map((k) => (k + " (" + map[k] + ")")).join(", ");
};

export const browser_buttons = (names) => {
    let content = names.map((name) => (
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

export const cart_img = (rmv, src_only) => {
    var src = "/static/re_cart." + (rmv ? "rmv" : "add") + ".png";
    if(src_only){
        return src;
    }
    var title = (rmv ? "remove cRE from cart" : "add cRE to cart");
    return <img className="rowCart" src={src} title={title} alt="cart" />;
}

export const popup = (p, c) => (
    <span data-toggle="tooltip" data-placement="top" title={p}>
	{c}
    </span>
)

export const creLinkPop = (accession, type, full, meta) => (
    popup("Click for cRE details")
)

export const geLink = (assembly, gene) => (
    '/geApp/' + assembly + "/?gene=" + gene
)

export const deLink = (assembly, gene) => (
    '/deApp/' + assembly + "/?gene=" + gene
)

export const geDeButton = (assembly) => (d) => {
    let _d = d.replace(/\./g, "%2e");
    let ge = <a href={geLink(assembly, _d)} target={"_blank"}>{d}</a>;
    if("mm10" !== assembly){
        return (<span>{ge}</span>);
    }
    var de = <a href={deLink(assembly, _d)} target={"_blank"}>&Delta;</a>;
    return (
	<span>
	    {ge}
	    {"&nbsp;&nbsp;"}
	    {de}
	</span>);
};

export const openGeLink = (gene) => (
    <div>
	This plot is displaying cell-wide expression of <em>{gene}</em>. To view expression in different subcellular compartments or biosample types, <a href={geLink(gene)} target={"_blank"}>click here</a>.
    </div>
)

export const geneDeLinks = (assembly) => (genesallpc) => {
    let all = commajoin(genesallpc[0].map(geDeButton(assembly)));
    let pc = commajoin(genesallpc[1].map(geDeButton(assembly)));
    return (
	<div>
	{"pc: "}{pc}
	<br />
	{"all: "}{all}
	</div>);
}

export const dccImg = () => (
    <img src="/static/encode/pennant-encode.png" alt="DCC logo" width="20" />);

export const dccLink = (expID) => {
    const url = 'https://www.encodeproject.org/experiments/' + expID;
    const img = dccImg();
    return <a target="_blank" href={url}>{img}</a>;
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
    const img = <img src="/static/encode/pennant-encode.png" alt="ENCODE logo"
		     style={{paddingLeft: "10px"}} />;
    return <a target="_blank" href={url}>{expAndFileID}{img}</a>;
}

export const cistromeLink = (acc) => (
    <a href={"https://www.ncbi.nlm.nih.gov/geo/query/acc.cgi?acc=" + acc} target='_blank'>{acc}</a>);

export const factorbook_link_tf = (assembly) => (d) => (
    <a href={"http://beta.factorbook.org/" + assembly + "/chipseq/tf/" + d} target="_blank">{d}</a>);

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

export const gene_link = (d) => (
    <em>
	<a href={"http://www.genecards.org/cgi-bin/carddisp.pl?gene=" + d}
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

export const searchLink = (data) => (approved_symbol) => {
    const d = {q: approved_symbol, assembly: data.assembly};
    const params = Object.keys(d).map((k) => (k + '=' + encodeURIComponent(d[k]))).join('&');
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

export const numWithCommas = (x) => {
    // http://stackoverflow.com/a/2901298
    var parts = x.toString().split(".");
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return parts.join(".");
}

export const concordantStar = (concordant) => {
    if(concordant){
	return (<span className="glyphicon glyphicon-star concordantStar"
		      aria-hidden="true"></span>);
    }
    return "";
}

export const checkCt = (checked) => (<input type={'checkbox' + (checked ? "checked " : "")} />);

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
	    {popup("Click for cRE details", cre.accession)}
	    <br />
	    {popup("Concordant", concordantStar(cre.concordant))}
	    {creTableAccessionProx(cre)}
	    {creTableAccessionBoxen(globals, cre)}
	</div>);
}

export const creTableCellTypeSpecific = (globals) => (data) => {
    let w = 12;
    let h = 9;
    let fw = 4 * w + 4;
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

    let col = (val, c) => {
	if(null === val){
	    return colors.NoData;
	}
	return val > 1.64 ? c : colors.Inactive;
    }
    
    let e = (
	<span className={"text-nowrap"}>
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
    return e;
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
    let cts = "";
    let ct = cre.ctspecifc.ct;
    if(ct){
	cts = (
	    <span>
		{globals.byCellType[ct][0]["name"]}:{'\u00A0'}
		{creTableCellTypeSpecific(globals, cre.ctspecifc)}
	    </span>);
    }
    
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
	    {cts}
	</div>);
}

export const sctSorter = (data) => {
    let col = (val) => {
	if(null === val){
	    return 0;
	}
	return val > 1.64 ? 2 : 1;
    };
    let p = Math.pow(2, col(data.promoter_zscore)) * 100;
    let e = Math.pow(2, col(data.enhancer_zscore)) * 10;
    let c = Math.pow(2, col(data.ctcf_zscore)) * 1;
    return e + p + c;
}
