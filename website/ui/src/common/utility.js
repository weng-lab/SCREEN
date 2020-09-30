/*
 * SPDX-License-Identifier: MIT
 * Copyright (c) 2016-2020 Michael Purcaro, Henry Pratt, Jill Moore, Zhiping Weng
 */

import React from 'react'
import {Helmet} from "react-helmet";

import HelpIcon from './components/help_icon'

export const panelize = (title, facet, helpkey = null, globals = null, headerStyle={}) => {
    return (
        <div className="panel-group facet">
	    <div className="panel panel-primary">
	        <div className="panel-heading" style={headerStyle}>
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
    ({uuid, assembly, accessions, coord_chrom, coord_start, coord_end,
      gene_all_start, gene_all_end,
      gene_pc_start, gene_pc_end,
      rank_dnase_start, rank_dnase_end,
      rank_promoter_start, rank_promoter_end,
      rank_enhancer_start, rank_enhancer_end,
      rank_ctcf_start, rank_ctcf_end,
      cellType, element_type}) => {
	  return {uuid, assembly,
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

function orJoinHelper(arr, sep) {
    // from https://stackoverflow.com/a/23619085
    if (0 === arr.length) {
	return [];
    }
    return arr.slice(1).reduce((xs, x, idx) => {
	let separator = (typeof sep === 'function')
		      ? sep(idx)
		      : sep;
	if((idx + 2) === arr.length){ // skipped first element!
	    separator += 'or ';
	}
	return xs.concat([separator, x]);
    }, [arr[0]]);
}
export const orjoin = (a) => (orJoinHelper(a, ', '))

export const linearScale = (d, r) => (v) => (
    // https://gist.github.com/vectorsize/7031902
    r[0] + (r[1] - r[0]) * ((v - d[0]) / (d[1] - d[0])));

export const toParams = (d) => (
    Object.keys(d).map((k) => (k + '=' + encodeURIComponent(d[k]))).join('&'))    

export const PageTitle = (assembly = null) => {
    const pageTitle = () => {
	if(assembly){
            return "SCREEN " + assembly + ": Search Candidate Regulatory Elements by ENCODE";
	}
	return "SCREEN: Search Candidate Regulatory Elements by ENCODE"
    }
    return (
	<Helmet>
            <title>{pageTitle()}</title>
	</Helmet>);
}
