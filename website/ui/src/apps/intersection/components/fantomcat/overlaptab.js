var React = require('react');

import PieChart from '../../../../plots/components/piechart';
import PlotWithHeader from '../../../../plots/components/plotwithheader';

const OverlapPieChart = ({ colspan, radius, height, data, header }) => {
    return <PlotWithHeader colspan={colspan} text={header} height={height}>
	<PieChart viewBox={{width: radius * 2, height: radius * 2}} radius={radius} stroke="#000"
          slices={[ {pct: data.intersecting / data.total, fill: "#444"},
		    {pct: 1.0 - data.intersecting / data.total, fill: "#fff"} ]} />
    </PlotWithHeader>
};

class OverlapTab extends React.Component {

    constructor(props) {
	super(props);
    }
    
    _render_piecharts(q) {
	return (
	    <div>
	        <div className="row">
	            <OverlapPieChart colspan="6" header="percent RNAs overlapping at least one cRE (non-coding)"
  	                height={300} radius={200} data={q.classes["non-coding"]} />
		    <OverlapPieChart colspan="6" header="percent RNAs overlapping at least one cRE (coding)"
 		        height={300} radius={200} data={q.classes["coding"]} />
	        </div>
		<div className="row">
		    <OverlapPieChart colspan="2" header="lncRNA, intergenic"
 	                height={150} radius={75} data={q.classes["lncRNA, intergenic"]} />
		    <OverlapPieChart colspan="2" header="lncRNA, antisense"
  	                height={150} radius={75} data={q.classes["lncRNA, antisense"]} />
		    <OverlapPieChart colspan="2" header="lncRNA, divergent"
	                height={150} radius={75} data={q.classes["lncRNA, divergent"]} />
		    <OverlapPieChart colspan="2" header="uncertain coding"
 	                height={150} radius={75} data={q.classes["uncertain coding"]} />
		    <OverlapPieChart colspan="2" header="mRNA"
  	                height={150} radius={75} data={q.classes["protein coding mRNAs"]} />
		    <OverlapPieChart colspan="2" header="sense overlap RNA"
	                height={150} radius={75} data={q.classes["sense overlap RNAs"]} />
		</div>
	    </div>
	);
    }    
    render() {
	return (
	    <div className="container-fluid">
		<div className="row">
	    	    <div className="col-md-12">
		        {this._render_piecharts(this.props.data)}
	            </div>
		</div>
            </div>
	);
    }
    
};
export default OverlapTab;
