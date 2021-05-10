import React from 'react';

import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";

function Scatter({innerSize, domain, data, showLowZscore, filterPoints,
		  onPointClick, onPointMouseOver, onPointMouseOut}) {
    const vbx = Math.floor(domain["x"]["start"]);
    const vby = Math.floor(domain["y"]["start"]);
    const width = Math.ceil(domain["x"]["end"] - domain["x"]["start"]) * 1.05;
    const height = Math.ceil(domain["y"]["end"] - domain["y"]["start"]) * 1.05;
    const viewBox = [vbx, vby, width, height].join(" ");
    const radius = width * 0.005;
    
    const handleClick = (e) => {
	if(e.target && e.target.id){
	    const i = e.target.id;
	    //console.log("onClick for point:", i);
	    onPointClick(i, e);
	}
    }

    const handleMouseEnter = (e) => {
	if(e.target && e.target.id){
	    const i = e.target.id;
	    //console.log("mouseEnter for point:", i, e);
	    onPointMouseOver(i, e);
	}
    }

    const handleMouseLeave = (e) => {
	if(e.target && e.target.id){
	    const i = e.target.id;
	    //console.log("mouseLeave for point:", i);
	    onPointMouseOut(i, e);
	}
    }

    const plotpoint = (p, i) => {
	if(filterPoints){
	    if(data[i].svgProps.fill === data[filterPoints].svgProps.fill){
		// go ahead and plot
	    } else {
	    	return (null);
	    }
	}
	
	if(p.metadata.isHigh > 1.64 || p.metadata.isHigh < -50){
	    return (
		<circle cx={p.x} cy={p.y} r={radius}
			key={i} id={i}
			{...p.svgProps}
			onMouseEnter={handleMouseEnter}
			onMouseLeave={handleMouseLeave}
		/>
	    );
	} else {
	    if(showLowZscore){
		return (
		    <rect x={p.x} y={p.y}
			  width={2*radius} height={2*radius}
			  key={i} id={i}
			  {...p.svgProps}
			  onMouseEnter={handleMouseEnter}
			  onMouseLeave={handleMouseLeave}
		    />
		);
	    } else {
		return (null);
	    }
	}
    }

    let isHigh = 0;
    let isLow = 0;
    let isMissing = 0;
    for(const p of data){
	if(p.metadata.isHigh > 1.64){
	    isHigh += 1;
	} else if(p.metadata.isHigh < -50){
	    isMissing += 1;
	} else {
	    isLow += 1;
	}
    }
    
    return (
	<TransformWrapper>
            <TransformComponent>
		<div>
		    <span>{"zscores: high: "}{isHigh}{"; low: "}{isLow}{"; missing: "}{isMissing}</span>
		    <svg className={"svgBox"} viewBox={viewBox} onClick={handleClick}
			 style={{width: innerSize.width, height:innerSize.height}} >
			{data.map((p, i) => {
			    return plotpoint(p,i);
			})}
		    </svg>
		</div>
	    </TransformComponent>
	</TransformWrapper>
	
    );
}

export default Scatter;
