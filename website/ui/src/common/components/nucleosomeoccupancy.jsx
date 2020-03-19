/*
 * SPDX-License-Identifier: MIT
 * Copyright (c) 2016-2020 Michael Purcaro, Henry Pratt, Zhiping Weng
 */

import React from 'react';
import Ztable from './ztable/ztable';
import { p_or_q } from './render';

export const dnase_tablecols = [
    {title: "biosample", data: "celltype", className: "dt-right"},
    {title: "chromosome", data: "chrom", className: "dt-right"},
    {title: "start", data: "start"},
    {title: "end", data: "stop"},
    {title: "signal", data: "signal", render: p_or_q},
    {title: "-log( p-value )", data: "p", render: p_or_q},
    {title: "-log( q-value )", data: "q", render: p_or_q},
    {title: "summit position", data: "summit"}
];

class NucleosomeOccupancy extends React.Component {

    constructor(props) {
	super(props);
	this.state = {
	    nucocc: null,
	    facets: {}
	};
    }

    componentWillReceiveProps(props) {
    console.log(props);
    console.log(this.props);
        if (this.props.q.chrom !== props.q.chrom
	    || this.props.q.start !== props.q.start
	    || this.props.q.end !== props.q.end) {
	  this.setState({ nucocc: null });
          this._update(props);
	}
    }

    componentDidMount() {
        this._update(this.props);
    }

    _update(props) {
	props.apiclient.search(
	    props.q, this.state.facets,
	    nucocc => this.setState({ nucocc }),
	    console.log
	);
    }

    resized() {
        return <span><br/>For performance, SCREEN cannot display complete lists of peaks in regions larger than 1 Mb. Results are being displayed for the region {this.props.resized}. To narrow your search, use the coordinates facet in the left pane.<br/><br/></span>;
    }

    render() {
	if (!this.state.nucocc) { return "Loading..."; }
	return (
	    <div>
	      {this.props.resized && this.resized()}
		  <Ztable data={this.state.nucocc.results.all}
			  cols={dnase_tablecols} pageLength={15} paging={true} emptyText="No nucleosome-free regions have been identified by ENCODE in this region."
			  bLengthChange={false} bFilter={true} sortCol={[ "q", false ]} title="" />
	    </div>
	);
    }
    
};
export default NucleosomeOccupancy;
