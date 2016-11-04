var React = require('react');
import {connect} from 'react-redux'

import VennDiagram from '../../../common/components/venn_diagram'

class ComparisonVenn extends React.Component {
    
    constructor(props) {
	super(props);
    }

    _get_venn(totals, overlaps) {
	var _overlaps = [];
	var skeys = {};
	var _sets = Object.keys(totals).map((k, i) => {skeys[k] = i; return {"label": k.replace(/_/g, " "), "size": totals[k]}});
	Object.keys(overlaps).map((k) => {
	    Object.keys(overlaps[k]).map((ck) => {_overlaps.push({
		sets: [skeys[k], skeys[ck]],
		size: overlaps[k][ck]
	    })});
	});
	return {
	    sets: _sets,
	    overlaps: _overlaps
	};
    }
    
    render() {
	var _missing_data = (!this.props.totals || this.props.totals.length == 0);
	var venn = (Object.keys(this.props.totals).length == 2 ? this._get_venn(this.props.totals, this.props.overlaps) : {sets: {}, overlaps: {}});
	return (<div>
		   <div style={{display: (_missing_data ? "block" : "none")}}>
		      <h3>Insufficient data to create the diagram.</h3>
		      Please modify the filter settings at left. At least two cell types must be selected to compare.
		   </div>
		   <div style={{display: (venn ? "block" : "none")}}>
		      <VennDiagram sets={venn.sets} overlaps={venn.overlaps} width={this.props.diagram_width} height = {this.props.diagram_height} />
		   </div>
		</div>);
    }
    
}
export default ComparisonVenn;

const props_map = (f) => (_state) => {
    var state = f(_state);
    return {
	diagram_width: state.diagram_width,
	diagram_height: state.diagram_height,
	overlaps: state.results.overlaps,
	totals: state.results.totals
    };
};

export const venn_connector = (pf) => connect(props_map(pf));
