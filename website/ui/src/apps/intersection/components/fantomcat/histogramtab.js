var React = require('react');

import Boxplot from '../../../../plots/components/boxplot';
import Histogram from '../../../../plots/components/histogram';

class HistogramTab extends React.Component {

    constructor(props) {
	super(props);
    }

    _render_boxplot(q, o) {
	if (!q) return <div />;
	return (<div><div className="row">
		<div className="col-md-6"><h3>cREs per kb</h3></div>
		<div className="col-md-6" />
		</div>
		<div className="row">
		<div style={{height: "600px"}} className="row-md-6">
		    <Boxplot viewBox={{width: 600, height: 450}} useiqr={true}
		        margin={{left: 5, bottom: 5, top: 0, right: 5}}
		        qsets={q} qsetorder={o} />
		</div>
		<div className="col-md-6" />
		</div>
		</div>);
    }

    _render_histograms(q) {
	return (<div><div className="row">
		<div className="col-md-6"><h3>cREs per kb, non-coding RNA</h3></div>
		<div className="col-md-6"><h3>cREs per kb, coding RNA</h3></div>
		</div>
		<div className="row">
	  	<div style={{height: "300px"}} className="col-md-6">
		    <Histogram x={Array.from(Array(100).keys()).map(x => x / 20.0)} y={q.classes["non-coding"].bins}
		       viewBox={{width: 400, height: 150}} ticklimit={5}
		       margin={{left: 5, bottom: 5, top: 0, right: 5}} />
		</div>
		<div style={{height: "300px"}} className="col-md-6">
		    <Histogram x={Array.from(Array(100).keys()).map(x => x / 20.0)} y={q.classes.coding.bins}
		       viewBox={{width: 400, height: 150}} ticklimit={5}
		       margin={{left: 5, bottom: 5, top: 0, right: 5}} />
		</div>
		</div></div>);
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
