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

