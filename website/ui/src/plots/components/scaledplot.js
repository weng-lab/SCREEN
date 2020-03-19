/*
 * SPDX-License-Identifier: MIT
 * Copyright (c) 2016-2020 Michael Purcaro, Henry Pratt, Zhiping Weng
 */

import React from 'react';
import ReactDOM from 'react-dom';
import { Button } from 'react-bootstrap';

const viewbox_text = v => ["0", "0", v.width, v.height].join(" ");

class ScaledPlot extends React.Component {
    componentWillReceiveProps(props, axis_padding) {
	this._viewsize = [props.viewBox.width - axis_padding[0],
			  props.viewBox.height - axis_padding[1]];
    }

    download() {
	let svg = ReactDOM.findDOMNode(this.refs.svgroot);
	svg.setAttribute("xmlns", "http://www.w3.org/2000/svg");
	let svgData = svg.outerHTML.replace(/<\/svg>/g, "<text x='50' y='30' font-size='24'>Courtesy of ENCODE</text></svg>");
	let preface = '<?xml version="1.0" standalone="no"?>\r\n';
	let svgBlob = new Blob([preface, svgData], {type:"image/svg+xml;charset=utf-8"});
	let svgUrl = URL.createObjectURL(svgBlob);
	let downloadLink = document.createElement("a");
	downloadLink.href = svgUrl;
	downloadLink.download = this.props.downloadfilename;
	document.body.appendChild(downloadLink);
	downloadLink.click();
	document.body.removeChild(downloadLink);
    }
    
    render(elem) {
	return (
		<div style={{position: "relative", height: "100%", width: "100%"}}>
		{this.props.downloadfilename ? <div><Button onClick={this.download.bind(this)}>Download figure</Button><br/></div> : null}
		<svg viewBox={viewbox_text(this.props.viewBox)} ref="svgroot"
		     style={{position: "absolute", width: "100%", height: "100%"}}>
		    {elem}
	        </svg>
	    </div>);
    }
};

export default ScaledPlot;
