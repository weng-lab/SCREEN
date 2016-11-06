var React = require('react');
import {connect} from 'react-redux'

import VennDiagram from '../../../common/components/venn_diagram'
import Heatmap from '../../../common/components/heatmap'
import {default_heatmap_layout} from '../../../common/components/heatmap'

const heatmap_layout = Object.assign({}, default_heatmap_layout);
heatmap_layout.margin = Object.assign({}, heatmap_layout.margin, {
    left: 250,
    top: 250
});

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

    _format_matrix(matrix) {
	var retval = [];
	if (!matrix) return retval;
	matrix.map((v, i) => {
	    v.map((_v, j) => {
		retval.push({row: i + 1, col: j + 1, value: _v});
	    })
	});
	return retval;
    }
    
    render() {
	var _missing_data = (!this.props.totals || Object.keys(this.props.totals).length < 2);
	var _show_venn = Object.keys(this.props.totals).length == 2;
	var venn = (Object.keys(this.props.totals).length == 2 ? this._get_venn(this.props.totals, this.props.overlaps) : {sets: {}, overlaps: {}});
	var rowlabels = (this.props.rowlabels ? this.props.rowlabels.map((d) => (d.replace(/_/g, " "))) : null);
	var collabels = (this.props.collabels ? this.props.collabels.map((d) => (d.replace(/_/g, " "))) : null);
	return (<div>
		   <div style={{display: (_missing_data ? "block" : "none")}}>
		      <h3>Insufficient data to create the diagram.</h3>
		      Please modify the filter settings at left. At least two cell types must be selected to compare.
		   </div>
		   <div style={{display: (_show_venn ? "block" : "none")}}>
		      <VennDiagram sets={venn.sets} overlaps={venn.overlaps} width={this.props.diagram_width} height={this.props.diagram_height} />
		   </div>
		   <div style={{display: (!_show_venn && !_missing_data ? "block": "none")}}>
		      <Heatmap rowlabels={rowlabels} collabels={collabels} data={this._format_matrix(this.props.matrix)}
		         min={0} max={1} chart_layout={heatmap_layout} />
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
	totals: state.results.totals,
	collabels: state.results.collabels,
	rowlabels: state.results.rowlabels,
	matrix: state.results.matrix
    };
};

export const venn_connector = (pf) => connect(props_map(pf));
