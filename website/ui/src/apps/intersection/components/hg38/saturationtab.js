import React from 'react';

import ViolinPlot from '../../../../plots/components/violinplot';
import PlotWithHeader from '../../../../plots/components/plotwithheader';

class SaturationTab extends React.Component {
    _render_boxplot(q, o) {
	if (!q) {
	    return <div />;
	}
	return (<div>
		<div className="row">
	            <PlotWithHeader colspan={12} text="saturation test" height={850} headersize={3}>
		        <ViolinPlot viewBox={{width: 1000, height: 850}}
		          margin={{left: 5, bottom: 5, top: 0, right: 5}}
		          qsets={q} qsetorder={o} range={[0]}
		          yticks={[0, 500000, 1000000, 1500000, 2000000]} />
		    </PlotWithHeader>
		</div>
		</div>);
    }
    
    render() {
	return (
	    <div className="container-fluid">
		<div className="row">
		    <div className="col-md-6">
	                {this._render_boxplot(this.props.data.qsets.hg19, this.props.data.qset_order.hg19)}
	            </div>
		    <div className="col-md-6">
	                {this._render_boxplot(this.props.data.qsets.hg38, this.props.data.qset_order.hg38)}
	            </div>
		</div>
		<div className="row">
		    <div className="col-md-12">
	                {this._render_boxplot(this.props.data.qsets.hg38_encode_cistrome, this.props.data.qset_order.hg38_encode_cistrome)}
	            </div>
		</div>		
	    </div>
	);
    }
    
};
export default SaturationTab;
