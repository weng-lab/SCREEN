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
    return snps.map(snp_link).join(",");
}

export const integer = {"display": (d) => (d == 1e12 ? "" : $.fn.dataTable.render.number( ',', '.', 0, '' )["display"](d))};
export const real = $.fn.dataTable.render.number( ',', '.', 1, '' );
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
    return (src_only ? src : '<img class="rowCart" src="' + src + '" title="' + (rmv ? "remove cRE from cart" : "add cRE to cart") + '">');
}

export const geDeButton = (d) => {
    var ge = '<a href="/geneexp/' + GlobalAssembly + '/' + d + '" target="_blank">' + d + '</a>';
    if("mm10" != GlobalAssembly){
        return ge;
    }
    var de = '<a href="/deGene/' + GlobalAssembly + '/' + d + '" target="_blank">&Delta;</a>';
    return ge + '&nbsp;&nbsp;' + de;
};

export const geDeButtons = (d) => {
    var p = d.split(", ");
    return p.map(geDeButton).join(", ");
};

export const dccLink = (expID) => {
    var url = 'https://www.encodeproject.org/experiments/' + expID;
    var img = '<img src="/static/encode/encode_logo_42.png" alt="ENCODE logo">';
    return '<a target="_blank" href="' + url + '">' + img + '</a>';
}

