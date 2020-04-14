/*
 * SPDX-License-Identifier: MIT
 * Copyright (c) 2016-2020 Michael Purcaro, Henry Pratt, Jill Moore, Zhiping Weng
 */

import React from 'react';

import {linearScale} from '../utility';
import {chain_functions} from '../common';

class HistogramSlider extends React.Component {
    constructor(props) {
	super(props);
	this.makeBars = this.makeBars.bind(this);
	this.updateDimensions = this.updateDimensions.bind(this);
	this.state = {width: 0};
	window.onresize = chain_functions(window.onresize, this.updateDimensions);
    }

    updateDimensions(){
	// tighten width by button slider icon width, else button will overhang slider bar
	const width = this.refs.box.clientWidth;
	this.setState({width});
    }
    
    componentDidMount(){
	this.updateDimensions();
    }

    UNSAFE_componentWillReceiveProps(nextProps){
	this.updateDimensions();
    }

    makeBars(){
	const width = this.state.width;
	const height = 20;
	const xScale = linearScale(this.props.range, [0, width]);
	const yScale = linearScale([0, this.props.data.binMax], [height, 0]);
	let e = (
            <span className={"text-nowrap"}>
                <svg width={width} height={height} >
	            <g>
			{this.props.data.bins.map((v, i) => {
			     const x = xScale(v[0]);
			     const y = yScale(v[1]);
			     const color = v[0] >= this.props.lvalue && v[0] < this.props.rvalue
					 ? "#000090" : "#a0a0a0";
			     return <rect width="1" height={height}
					  x={x}
					  y={y}
					  key={i}
					  fill={color} />;
			 })}
		    </g>
		</svg>
	    </span>);
	return e;
    }
    
    render() {
	
	return (
	    <div ref="box" style={{width: "100%", height: "20px"}}>
		{this.state.width > 0 && this.makeBars()}
	    </div>);
    }
}

export default HistogramSlider;
