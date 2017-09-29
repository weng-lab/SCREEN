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
	     <Line
		 dataKey={k.text}
		 stroke={k.color}
		 type={k.type ? k.type : "monotone"} />
	) )}
    </LineChart>
);

class CistromeTab extends React.Component {
    render() {
	return (
	    <div className="container-fluid">
		{this.doRenderWrapper(this.props)}
            </div>
	);
    }

    doRenderWrapper({ data, actions }){

	console.log(data);
	
	let overview_row = (
            <div className="row">
                <div className="col-md-12">
	            <h3>ENCODE + Cistrome hg38 vs ENCODE hg19 lifted over</h3>
	            <Hg19Hg38Plot width={1500} height={900} data={data.cistrome}
	              keys={[ {text: "lifted over ENCODE hg19 cREs", color: "#8884d8"},
		              {text: "ENCODE and Cistrome hg38 cREs", color: "#d88488"} ]} />
                </div>
            </div>
	);
	
        return (
            <div className="container-fluid">
		{overview_row}
            </div>
	);
	
    }
    
};
export default CistromeTab;
