import React from 'react'
import HelpIcon from './components/help_icon'

export const panelize = (title, facet, helpkey = null, globals = null) => {
    return (
        <div className="panel-group facet">
	    <div className="panel panel-primary">
	        <div className="panel-heading">
		    {title}
		    {helpkey && <HelpIcon globals={globals}
					  helpkey={helpkey}
					  color={"#ffffff"} />}
		</div>
	        <div className="panel-body">{facet}</div>
	    </div>
	</div>);
};

export const tabPanelize = (content) => {
    return (
        <div>
            <div className={"panel panel-default"}>
                <div className={"panel-body"}>
                    <div className={"container-fluid"}>
	                {content}
	            </div>
	        </div>
	    </div>
        </div>);
}

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
    ({assembly, accessions, coord_chrom, coord_start, coord_end,
      gene_all_start, gene_all_end,
      gene_pc_start, gene_pc_end,
      rank_dnase_start, rank_dnase_end,
      rank_promoter_start, rank_promoter_end,
      rank_enhancer_start, rank_enhancer_end,
      rank_ctcf_start, rank_ctcf_end,
      cellType, element_type}) => {
	  return {assembly,
                  accessions, coord_chrom, coord_start, coord_end,
                  gene_all_start, gene_all_end,
		  gene_pc_start, gene_pc_end,
                  rank_dnase_start, rank_dnase_end,
                  rank_promoter_start, rank_promoter_end,
                  rank_enhancer_start, rank_enhancer_end,
                  rank_ctcf_start, rank_ctcf_end, cellType, element_type};
      }

export const arrowNote = (msg) => {
    return (
        <div>
            <h4>
                <span className="glyphicon glyphicon-arrow-left"
                      aria-hidden="true" style={{color: "red"}}>
                </span>
        &nbsp;&nbsp;{msg}
            </h4>
        </div>);
}

export const isCart = () => {
    let href = window.location.href;
    return href.includes("&cart");
}

function intersperse(arr, sep) {
    // from https://stackoverflow.com/a/23619085
    if (0 === arr.length) {
	return [];
    }
    return arr.slice(1).reduce((xs, x, idx) => {
	const separator = (typeof sep === 'function')
			? sep(idx)
			: sep;
	return xs.concat([separator, x]);
    }, [arr[0]]);
}

export const commajoin = (a) => (intersperse(a, ', '))
export const brJoin = (a) => (intersperse(a, (idx) => (<br />)))
export const nbspJoin = (a) => (intersperse(a, (idx) => (<span key={idx}>,&nbsp;</span>)))

export const orjoin = (a) => {
    return [a.slice(0, -1).reduce((prev, curr) => [prev, ", ", curr]),
	    " or ", a.slice(-1)];
}

export const linearScale = (d, r) => (v) => (
    // https://gist.github.com/vectorsize/7031902
    r[0] + (r[1] - r[0]) * ((v - d[0]) / (d[1] - d[0])));
