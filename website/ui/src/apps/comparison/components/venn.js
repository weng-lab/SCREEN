var React = require('react');
import {connect} from 'react-redux'

import VennDiagram from '../../../common/components/venn_diagram'
import Heatmap from '../../../common/components/heatmap'
import {default_heatmap_layout} from '../../../common/components/heatmap'

import {invalidate_comparison} from '../helpers/invalidate_results'

import {SET_TABLE_CELL_TYPES} from '../reducers/venn_reducer'
import {SELECT_TAB} from '../../search/reducers/tab_reducer'
import {TAB_ACTION} from '../../search/reducers/root_reducer'

const heatmap_layout = Object.assign({}, default_heatmap_layout);
heatmap_layout.margin = Object.assign({}, heatmap_layout.margin, {
    left: 250,
    top: 250
});

class ComparisonVenn extends React.Component {
    
    constructor(props) {
	super(props);
	this.onClick = this.onClick.bind(this);
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

    onClick(r, c) {
	if (r == c) return;
	this.props.onClick(this.props.rowlabels[r], this.props.collabels[c]);
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
		      <VennDiagram helpkey="comparison_venn" sets={venn.sets} overlaps={venn.overlaps} width={this.props.diagram_width} height={this.props.diagram_height} />
		   </div>
		   <div style={{display: (!_show_venn && !_missing_data ? "block": "none")}}>
		      <Heatmap helpkey="comparison_heatmap" rowlabels={rowlabels} collabels={collabels} data={this._format_matrix(this.props.matrix)}
		         min={0} max={1} chart_layout={heatmap_layout} onClick={this.onClick} />
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

const dispatch_map = (store) => (f) => (_dispatch) => {
    var dispatch = f(_dispatch);
    return {
	onClick: (rl, cl) => {
	    dispatch({
		type: SET_TABLE_CELL_TYPES,
		table_cell_types: [rl, cl]
	    });
	    dispatch(invalidate_comparison(store.getState()));
	    dispatch({
		type: TAB_ACTION,
		target: "main_tabs",
		subaction: {
		    type: SELECT_TAB,
		    selection: "results"
		}
	    });
	}
    };
};

export const venn_connector = (store) => (pf, df) => connect(props_map(pf), dispatch_map(store)(df));
