import React from 'react';

import Boxplot from '../../../../plots/components/boxplot';
import Histogram from '../../../../plots/components/histogram';
import PlotWithHeader from '../../../../plots/components/plotwithheader';

class HistogramTab extends React.Component {

    constructor(props) {
	super(props);
    }

    _render_boxplot(q, o) {
	if (!q) return <div />;
	return (<div>
		<div className="row">
	            <PlotWithHeader colspan={6} text="cREs per kb, outliers hidden" height={450} headersize={3}>
		        <Boxplot viewBox={{width: 600, height: 450}} useiqr={true}
		          margin={{left: 5, bottom: 5, top: 0, right: 5}}
		          qsets={q} qsetorder={o} range={[0, 5]} hideoutliers={true} />
		    </PlotWithHeader>
		    <PlotWithHeader colspan={6} text="cREs per kb, outliers shown" height={450} headersize={3}>
		        <Boxplot viewBox={{width: 600, height: 450}} useiqr={true}
		          margin={{left: 5, bottom: 5, top: 0, right: 5}}
		          qsets={q} qsetorder={o} />
		    </PlotWithHeader>
		</div>
		</div>);
    }

    _render_histograms(q) {
	return (<div>
		  <div className="row">
		    <PlotWithHeader colspan={6} text="cREs per kb, non-coding RNA" height={300} headersize={3}>
		        <Histogram x={Array.from(Array(100).keys()).map(x => x / 20.0)} y={q.classes["non-coding"].bins}
		          viewBox={{width: 400, height: 150}} ticklimit={5}
		          margin={{left: 5, bottom: 5, top: 0, right: 5}} />
		    </PlotWithHeader>
		    <PlotWithHeader colspan={6} text="cREs per kb, coding RNA" height={300} headersize={3}>
		        <Histogram x={Array.from(Array(100).keys()).map(x => x / 20.0)} y={q.classes.coding.bins}
		          viewBox={{width: 400, height: 150}} ticklimit={5}
		          margin={{left: 5, bottom: 5, top: 0, right: 5}} />
		    </PlotWithHeader>
		  </div>
		</div>);
    }
    
    render() {
	return (
	    <div className="container-fluid">
		<div className="row">
		    <div className="col-md-12">
		        {this._render_histograms(this.props.data)}
	                {this._render_boxplot(this.props.qsets, this.props.qset_order)}
	            </div>
		</div>
	    </div>
	);
    }
    
};
export default HistogramTab;
