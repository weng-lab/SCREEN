/*
 * SPDX-License-Identifier: MIT
 * Copyright (c) 2016-2020 Michael Purcaro, Henry Pratt, Zhiping Weng
 */

import React from 'react';
import Ztable from './ztable/ztable';

export const interactions_tablecols = [
    {title: "biosample", data: "celltype", className: "dt-right"},
    {title: "assay", data: "assay", className: "dt-right"},
    {title: "chromosome A", data: "achrom", className: "dt-right"},
    {title: "start A", data: "astart"},
    {title: "end A", data: "astop"},
    {title: "chromosome B", data: "bchrom", className: "dt-right"},
    {title: "start B", data: "bstart"},
    {title: "end B", data: "bstop"},
    {title: "Z score", data: "z" }
];

class Interactions extends React.Component {

    constructor(props) {
	super(props);
	this.state = {
	    interactions: null,
	    facets: {}
	};
    }

    componentWillReceiveProps(props) {
        if (this.props.q.chrom !== props.q.chrom
	    || this.props.q.start !== props.q.start
	    || this.props.q.end !== props.q.end) {
	  this.setState({ interactions: null });
          this._update(props);
	}
    }

    componentDidMount() {
        this._update(this.props);
    }

    _update(props) {
	props.apiclient.search(
	    props.q, this.state.facets,
	    interactions => this.setState({ interactions }),
	    console.log
	);
    }

    resized() {
        return <span><br/ >For performance, SCREEN cannot display complete lists of peaks in regions larger than 1 Mb. Results are being displayed for the region {this.props.resized}. To narrow your search, use the coordinates facet in the left pane.<br/><br/></span>;
    }

    render() {
	if (!this.state.interactions) { return "Loading..."; }
	console.log(this.state.interactions);
	return (
	    <div>
	      {this.props.resized && this.resized()}
		  <Ztable data={this.state.interactions.results.all}
			  cols={interactions_tablecols} pageLength={15} paging={true} emptyText="No long distance interactions have been identified by ENCODE in this region."
			  bLengthChange={false} bFilter={true} sortCol={[ "z", false ]} title="" />
	    </div>
	);
    }
    
};
export default Interactions;
