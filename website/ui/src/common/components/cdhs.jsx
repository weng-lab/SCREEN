/*
 * SPDX-License-Identifier: MIT
 * Copyright (c) 2016-2020 Michael Purcaro, Henry Pratt, Zhiping Weng
 */

import React from 'react';
import Ztable from './ztable/ztable';

export const cDHS_tablecols = [
    {title: "ID", data: "dacc", className: "dt-right"},
    {title: "chromosome", data: "chrom", className: "dt-right"},
    {title: "start", data: "start"},
    {title: "end", data: "stop"},
    {title: "score", data: "score"},
    {title: "center start", data: "centerstart"},
    {title: "center end", data: "centerstop"},
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
			  cols={cDHS_tablecols} pageLength={15} paging={true} emptyText="No long distance interactions have been identified by ENCODE in this region."
			  bLengthChange={false} bFilter={true} sortCol={[ "z", false ]} title="" />
	    </div>
	);
    }
    
};
export default Interactions;
