import ReactDOMServer from 'react-dom/server'

// datatbles render has params function (data, type, full, meta)

export const relink = (a) => (v) => (
    "<a href='/search?assembly=" + a + "&q=" + v + "' target='_blank'>"
    + v + "</a>");

export const snp_link = (d) => {
    var url = "http://ensembl.org/Homo_sapiens/Variation/Explore";
    if("mm10" == GlobalAssembly){
        url = "http://ensembl.org/Mus_musculus/Variation/Explore";
    }
    return '<a href="' + url + '?vdb=variation;v=' + d + '" target="_blank">'
         + d + '</a>';
}

export const snpLinks = (snps) => {
    return snps.map(snp_link).join(", ");
}

export const integer = {"display": (d) => (d == 1e12 ? "" : $.fn.dataTable.render.number( ',', '.', 0, '' )["display"](d))};

export const integerLink = (href) => (d) => {
    return "<a href='#" + href + "'>" + d + "</a>";
}

export const toSciNot = (d) => {
    if(d < 0.01){
	return d.toExponential(1);
    }
    return Math.round(d * 100) / 100;
}

export const real = $.fn.dataTable.render.number( ',', '.', 2, '' );
export const z_score = (d) => (d == -11.0 ? "--" : $.fn.dataTable.render.number(',', '.', 2, '')["display"](d));
export const cell_type = (d) => (d.replace(/_/g, " "));

export const support = (support) => (
    ("eqtls" in support ? support.eqtls.length : 0) + ("chiapet" in support ? support.chiapet.length : 0)
);
export const len = (list) => (list ? list.length : 0);
export const supporting_cts = (list) => {
    if (list == null) return "";
    var map = {};
    list.map((x) => {
	if (!(x["cell-type"] in map)) map[x["cell-type"]] = 0;
	++map[x["cell-type"]];
    });
    return Object.keys(map).map((k) => (k + " (" + map[k] + ")")).join(", ");
};

export const browser_buttons = (names) => {
    var bg = '<div class="btn-group" role="group">';
    for (var i = 0; i < names.length; i++) {
	bg += '<button type="button" class="btn btn-default btn-xs">' + names[i] + '</button>';
    }
    return bg + "</div>";
}

export const cart_img = (rmv, src_only) => {
    var src = "/static/re_cart." + (rmv ? "rmv" : "add") + ".png";
    if(src_only){
        return src;
    }
    var title = (rmv ? "remove cRE from cart" : "add cRE to cart");
    return '<img class="rowCart" src="' + src + '" title="' +  title + '">';
}

export const creLink = (accession) => (
    '<a href="#">' + accession + '</a>'
)

export const popup = (p, c) => {
    return '<span data-toggle="tooltip" data-placement="top" title="' + p + '">' + c + '</span>';
}

export const popupReact = (p, c) => {
    return (
	<span data-toggle="tooltip" data-placement="top" title={p}>
	    {c}
	</span>);
}

export const creLinkPop = (accession, type, full, meta) => (
    popup("Click for cRE details", creLink(accession))
)

export const openGeLink = (gene) => {
    return (<div>
    This plot is displaying cell-wide expression of <em>{gene}</em>. To view expression in different subcellular compartments or biosample types, <a href={geLink(gene)} target={"_blank"}>click here</a>.
    </div>);
}

export const geLink = (gene) => {
    return '/geApp/' + GlobalAssembly + "/?gene=" + gene;
}

export const deLink = (gene) => {
    return '/deApp/' + GlobalAssembly + "/?gene=" + gene;
}

export const geDeButton = (d) => {
    let _d = d.replace(/\./g, "%2e");
    var ge = '<a href="' + geLink(_d) + '" target="_blank">' + d + '</a>';
    if("mm10" != GlobalAssembly){
        return ge;
    }
    var de = '<a href="' + deLink(_d) + '" target="_blank">&Delta;</a>';
    return ge + '&nbsp;&nbsp;' + de;
};

export const geneDeLinks = (genesallpc) => {
    let all = genesallpc[0].map(geDeButton).join(", ");
    let pc = genesallpc[1].map(geDeButton).join(", ");
    return "pc: " + pc + "<br />all: " + all;
};

export const dccImg = () => (
    '<img src="/static/encode/pennant-encode.png" alt="DCC logo" width="20">'
)

export const dccLink = (expID) => {
    var url = 'https://www.encodeproject.org/experiments/' + expID;
    var img = dccImg();
    return '<a target="_blank" href="' + url + '">' + img + '</a>';
}

export const dccLinkCtGroupExpIDs = (accs) => {
    let q = accs.join("&accession=");
    var url = 'https://www.encodeproject.org/search/?accession=' + q;
    var img = dccImg();
    return '<a target="_blank" href="' + url + '">' + img + '</a>';
}

export const dccLinkCtGroup = (ctn) => {
    let accs = Globals.byCellType[ctn].map((info) => {
        return info.expID; });
    let q = accs.join("&accession=");
    var url = 'https://www.encodeproject.org/search/?accession=' + q;
    var img = dccImg();
    return '<a target="_blank" href="' + url + '">' + img + '</a>';
}

export const dccLinkCtGroupCus = (ctn, content) => {
    let accs = Globals.byCellType[ctn].map((info) => {
        return info.expID; });
    let q = accs.join("&accession=");
    var url = 'https://www.encodeproject.org/search/?accession=' + q;
    return '<a target="_blank" href="' + url + '">' + content + '</a>';
}

export const dccLinkAndIconSplit = (expAndFileID) => {
    let expID = expAndFileID.split(' / ')[0];
    var url = 'https://www.encodeproject.org/experiments/' + expID;
    var img = '<img src="/static/encode/pennant-encode.png" alt="ENCODE logo">';
    return '<a target="_blank" href="' + url + '">' + expAndFileID + "&nbsp;" + img + '</a>';
}

export const factorbook_link_tf = (d) => (
    '<a href="http://beta.factorbook.org/human/chipseq/tf/' + d + '" target="_blank">' + d + '</a>');

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
    '<em><a href="http://www.genecards.org/cgi-bin/carddisp.pl?gene=' + d + '" target="_blank">' + d + '</a></em>');

export const position = (pos) => (pos.chrom + ":" + pos.start + "-" + pos.end);
export const bp = (v) => (v + " bp");

export const nul = (d) => ('')

export const tabTitle = (c) => {
    return (
        <span className="text-center">
            {c[0]}<br />{c[1]}
        </span>);
};

export const upperCase = (d) => (d.toUpperCase())

export const searchLink = (data) => (approved_symbol) => {
    let params = jQuery.param({q: approved_symbol,
                               assembly: data.assembly});
    let url = "/search/?" + params;
    return "<a href='" + url + "'>" + approved_symbol + "</a>";
}

export const assayIcon = (ctn) => {
    let colors = Globals.colors.cREs;

    let assays = Globals.byCellType[ctn].map((a) => (a.assay));
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
    let c = dccLinkCtGroupCus(ctn, ReactDOMServer.renderToStaticMarkup(e));
    return popup(title, c);
}

export const creGroupIcon = (creGroup) => {
    let colors = Globals.colors.cREs;
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
    let c = ReactDOMServer.renderToStaticMarkup(e);
    return popup(title, c);
}

export const sctGroupIcon = (creGroup) => {
    let colors = Globals.colors.cREs;
    let lookupTitle = {'C' : "CTCF-only",
                       'E' : "Enhancer-like",
                       'P' : "Promoter-like",
                       'D' : "DNase",
                       'I' : "Inactive",
                       'U' : "Unclassified" };
    let lookupColor = {'C' : colors.CTCF,
		       'E' : colors.H3K27ac,
		       'P' : colors.H3K4me3,
                       'D' : colors.DNase,
                       'I' : colors.Inactive,
                       'U' : colors.Unclassified}
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
    let c = ReactDOMServer.renderToStaticMarkup(e);
    return popup(title, c);
}

export const sctGroupIconLegend = (creGroup) => {
    let colors = Globals.colors.cREs;
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
	return '<span class="glyphicon glyphicon-star concordantStar" aria-hidden="true"></span>';
    }
    return "";
}

export const concordantStarReact = (concordant) => {
    if(concordant){
	return (
	    <span className="glyphicon glyphicon-star concordantStar"
		  aria-hidden="true">
	    </span>);
    }
    return "";
}

export const checkCt = (cts) => (name) => {
    if(cts.has(name)){
	return "<input type='checkbox' checked />";
    }
    return "<input type='checkbox' />";
}

export const creTableAccesionBoxen = (cre) => {
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
    let colors = Globals.colors.cREs;

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

export const creTableAccesionProx = (cre) => {
    return cre.isproximal ? popup("Proximal", "P") :
	       popup("Distal", "D");
}

export const creTableAccesionProxReact = (cre) => {
    return cre.isproximal ? popupReact("Proximal", "P") :
	       popupReact("Distal", "D");
}

export const creTableAccesion = (cre, type, full, meta) => {
    return '<div>' + 
	   popup("Click for cRE details", creLink(cre.accession)) +
	   '<br />' +
	   popup("Concordant", concordantStar(cre.concordant)) +
	   creTableAccesionProx(cre) + ' ' +
	   ReactDOMServer.renderToStaticMarkup(creTableAccesionBoxen(cre)) +
	   '</div>';
}

export const creTableCellTypeSpecific = (data) => {
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
    let colors = Globals.colors.cREs;

    let col = (val, c) => ( val > 1.64 ? c : colors.Inactive )
    
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
    let boxen = ReactDOMServer.renderToStaticMarkup(e);
    return '<div>' + boxen + '</div>';
}
