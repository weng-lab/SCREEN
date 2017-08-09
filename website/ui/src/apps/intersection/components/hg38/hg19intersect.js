import React from 'react';

import {LineChart, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Line } from 'recharts';

const Hg19Hg38Plot = ({ width, height, data, keys }) => (
    <LineChart width={width} height={height} data={data}
      margin={{ top: 50, right: 50, left: 50, bottom: 50 }}>
        <XAxis dataKey="name" label="overlap fraction" />
        <YAxis label="% regions with overlap" domain={[0.0, 1.0]} />		
        <CartesianGrid strokeDasharray="3 3" />
        <Tooltip />
        <Legend />
	{keys.map(k => (
	    <Line type="monotone" dataKey={k.text} stroke={k.color}
	      type={k.type ? k.type : "monotone"} />
	) )}
    </LineChart>
);

class Hg19IntersectTab extends React.Component {

    constructor(props) {
	super(props);
    }
    
    render() {
	console.log(this.props);
	return (
	    <div className="container-fluid">
		{this.doRenderWrapper(this.props)}
            </div>
	);
    }

    doRenderWrapper({ data, actions }){
	
	let overview_row = (
            <div className="row">
                <div className="col-md-6">
	            <h3>hg38 lifted over to hg19</h3>
	            <Hg19Hg38Plot width={1000} height={600} data={data.hg19}
	              keys={[ {text: "original hg19 cREs", color: "#8884d8"},
		              {text: "lifted over hg38 cREs", color: "#d88488"} ]} />
                </div>
		<div className="col-md-6">
		    <h3>hg19 lifted over to hg38</h3>
		    <Hg19Hg38Plot width={1000} height={600} data={data.hg38}
	              keys={[ {text: "original hg38 cREs", color: "#8884d8"},
		              {text: "lifted over hg19 cREs", color: "#d88488"} ]} />
                </div>
            </div>
	);

	let ninestate_row = (
            <div className="row">
                <div className="col-md-6">
	            <h3>hg38 lifted over to hg19</h3>
	            <Hg19Hg38Plot width={1000} height={600} data={data.hg19}
	              keys={[ {text: "hg19 high DNase", color: "#06da93"},
			      {text: "hg19 high H3K4me3", color: "#ff0000"},
			      {text: "hg19 high H3K27ac", color: "#ffcd00"},
			      {text: "hg19 high CTCF", color: "#00b0f0"} ]} />
                </div>
		<div className="col-md-6">
		    <h3>hg19 lifted over to hg38</h3>
	            <Hg19Hg38Plot width={1000} height={600} data={data.hg38}
	              keys={[ {text: "hg38 high DNase", color: "#06da93"},
			      {text: "hg38 high H3K4me3", color: "#ff0000"},
			      {text: "hg38 high H3K27ac", color: "#ffcd00"},
			      {text: "hg38 high CTCF", color: "#00b0f0"} ]} />
                </div>
            </div>
	);
	
        return (
            <div className="container-fluid">
		{overview_row}
	        {ninestate_row}
            </div>
	);
	
    }
    
};
export default Hg19IntersectTab;
