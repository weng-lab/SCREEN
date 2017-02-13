import HelpIcon from './components/help_icon'

export const panelize = (title, facet, helpkey = null) => {
    let helpicon = (helpkey ? <HelpIcon helpkey={helpkey} color={"#ffffff"} /> : "");
    return (<div className="panel-group facet">
	    <div className="panel panel-primary">
	    <div className="panel-heading">{title} {helpicon}</div>
	    <div className="panel-body">
            {facet}
	    </div>
	    </div>
	    </div>);
};

export const doToggle = (oldSet, item) => {
    let ret = new Set(oldSet);
    if(ret.has(item)){
        ret.delete(item);
    } else {
        ret.add(item);
    }
    return ret;
}

export const getCommonState =
    ({accessions, coord_chrom, coord_start, coord_end,
      gene_all_start, gene_all_end,
      gene_pc_start, gene_pc_end,
      rank_dnase_start, rank_dnase_end,
      rank_promoter_start, rank_promoter_end,
      rank_enhancer_start, rank_enhancer_end,
      rank_ctcf_start, rank_ctcf_end,
      cellType, element_type}) => {
	  return {GlobalAssembly,
                  accessions, coord_chrom, coord_start, coord_end,
                  gene_all_start, gene_all_end,
		  gene_pc_start, gene_pc_end,
                  rank_dnase_start, rank_dnase_end,
                  rank_promoter_start, rank_promoter_end,
                  rank_enhancer_start, rank_enhancer_end,
                  rank_ctcf_start, rank_ctcf_end, cellType, element_type};
      }

export const render_relink = (a) => (v) => (
    "<a href='/search?assembly=" + a + "&q=" + v + "' target='_blank'>"
        + v + "</a>");

export const render_snp_link = (d) => {
    var url = "http://ensembl.org/Homo_sapiens/Variation/Explore";
    if("mm10" == GlobalAssembly){
        url = "http://ensembl.org/Mus_musculus/Variation/Explore";
    }
    return '<a href="' + url + '?vdb=variation;v=' + d + '" target="_blank">'
        + d + '</a>';
}


