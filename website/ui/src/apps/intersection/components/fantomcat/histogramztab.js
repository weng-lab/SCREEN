import React from 'react';

import Boxplot from '../../../../plots/components/boxplot';
import Histogram from '../../../../plots/components/histogram';
import PlotWithHeader from '../../../../plots/components/plotwithheader';

class HistogramZTab extends React.Component {
    _render_boxplot(q, o, l) {
	if (!q) return <div />;
	return (<div>
		<div className="row">
	            <PlotWithHeader colspan={4} text="all RNA classes, outliers hidden" height={450} headersize={3}>
		        <Boxplot viewBox={{width: 600, height: 450}} useiqr={true}
		          margin={{left: 5, bottom: 5, top: 0, right: 5}}
		          qsets={q.h3k4me3} qsetorder={o} range={[0, 5]} hideoutliers={true} />
		    </PlotWithHeader>
		    <PlotWithHeader colspan={4} text="all RNA classes, outliers hidden" height={450} headersize={3}>
		        <Boxplot viewBox={{width: 600, height: 450}} useiqr={true}
		          margin={{left: 5, bottom: 5, top: 0, right: 5}}
		          qsets={q.h3k27ac} qsetorder={o} range={[0, 5]} hideoutliers={true} />
		    </PlotWithHeader>
		    <PlotWithHeader colspan={4} text="all RNA classes, outliers hidden" height={450} headersize={3}>
		        <Boxplot viewBox={{width: 600, height: 450}} useiqr={true}
		          margin={{left: 5, bottom: 5, top: 0, right: 5}}
		          qsets={q.ctcf} qsetorder={o} range={[0, 5]} hideoutliers={true} />
		    </PlotWithHeader>
		</div>
		<div className="row">
		    <PlotWithHeader colspan={4} text="all RNA classes, outliers shown" height={450} headersize={3}>
		        <Boxplot viewBox={{width: 600, height: 450}} useiqr={true}
		          margin={{left: 5, bottom: 5, top: 0, right: 5}}
		          qsets={q.h3k4me3} qsetorder={o} />
		    </PlotWithHeader>
		    <PlotWithHeader colspan={4} text="all RNA classes, outliers shown" height={450} headersize={3}>
		        <Boxplot viewBox={{width: 600, height: 450}} useiqr={true}
		          margin={{left: 5, bottom: 5, top: 0, right: 5}}
		          qsets={q.h3k27ac} qsetorder={o} />
		    </PlotWithHeader>
		    <PlotWithHeader colspan={4} text="all RNA classes, outliers shown" height={450} headersize={3}>
		        <Boxplot viewBox={{width: 600, height: 450}} useiqr={true}
		          margin={{left: 5, bottom: 5, top: 0, right: 5}}
		          qsets={q.ctcf} qsetorder={o} />
		    </PlotWithHeader>
		</div>
		</div>);
    }

    _render_histograms(q, l) {
	return (<div>
		  <div className="row">
		      <PlotWithHeader colspan={4} text={l} height={300} headersize={3}>
		        <Histogram x={Array.from(Array(100).keys()).map(x => x / 20.0)} y={q.h3k4me3.classes[l].bins}
		          viewBox={{width: 400, height: 150}} ticklimit={5}
		          margin={{left: 5, bottom: 5, top: 0, right: 5}} />
		    </PlotWithHeader>
		    <PlotWithHeader colspan={4} text={l} height={300} headersize={3}>
		        <Histogram x={Array.from(Array(100).keys()).map(x => x / 20.0)} y={q.h3k27ac.classes[l].bins}
		          viewBox={{width: 400, height: 150}} ticklimit={5}
		          margin={{left: 5, bottom: 5, top: 0, right: 5}} />
 		    </PlotWithHeader>
		    <PlotWithHeader colspan={4} text={l} height={300} headersize={3}>
		        <Histogram x={Array.from(Array(100).keys()).map(x => x / 20.0)} y={q.ctcf.classes[l].bins}
		          viewBox={{width: 400, height: 150}} ticklimit={5}
		          margin={{left: 5, bottom: 5, top: 0, right: 5}} />
		    </PlotWithHeader>
		  </div>
		</div>);
    }
    
    render() {
	console.log(this.props.qsets);
	return (
	    <div className="container-fluid">
		<div className="row">
		    <div className="col-md-4"><h3>cREs with high H3K4me3</h3></div>
		    <div className="col-md-4"><h3>cREs with high H3K27ac</h3></div>
		    <div className="col-md-4"><h3>cREs with high CTCF</h3></div>
		</div>
   	        {this._render_histograms(this.props.data, "coding")}
	        {this._render_histograms(this.props.data, "non-coding")}
	        {this._render_boxplot(this.props.qsets, this.props.qset_order)}
	    </div>
	);
    }
    
};
export default HistogramZTab;
