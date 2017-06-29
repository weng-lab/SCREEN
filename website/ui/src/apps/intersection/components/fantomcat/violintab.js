import React from 'react';

import ViolinPlot from '../../../../plots/components/violinplot';
import PlotWithHeader from '../../../../plots/components/plotwithheader';

class ViolinTab extends React.Component {

    constructor(props) {
	super(props);
    }

    _render_boxplot(q, o) {
	if (!q) return <div />;
	return (<div>
		<div className="row">
	            <PlotWithHeader colspan={12} text="saturation test" height={850} headersize={3}>
		        <ViolinPlot viewBox={{width: 1000, height: 850}}
		          margin={{left: 5, bottom: 5, top: 0, right: 5}}
		          qsets={q} qsetorder={o} />
		    </PlotWithHeader>
		</div>
		</div>);
    }
    
    render() {
	return (
	    <div className="container-fluid">
		<div className="row">
		    <div className="col-md-12">
	                {this._render_boxplot(this.props.qsets, this.props.qset_order)}
	            </div>
		</div>
	    </div>
	);
    }
    
};
export default ViolinTab;
