var $ = require('jquery');
var React = require('react');
import {connect} from 'react-redux'
import {render} from 'react-dom'

import HorizontalBar from '../../../common/components/horizontal_bar'
import {TissueColors} from '../config/colors'

const c_rank_fs = {
    "promoter": (d) => (d.ranks["promoter"]),
    "enhancer": (d) => (d.ranks["enhancer"]),
    "CTCF": (d) => (d.ranks["ctcf"]),
    "DNase": (d) => (d.ranks["dnase"])
};

const rank_fs = {
    "promoter": (d) => (d["H3K4me3-Only"]),
    "enhancer": (d) => (d["H3K27ac-Only"]),
    "CTCF": (d) => (d["CTCF-Only"]),
    "DNase": (d) => (d["rank"])
};

const format_data_for_bar_graph = (data, rank_type, threshold) => {
    var retval = {};
    var rank_f = rank_fs[rank_type];
    var c_rank_f = c_rank_fs[rank_type];
    for (var i in data) {
	for (var k in c_rank_f(data[i])) {
	    if (TISSUE_MAP[k] == "") continue;
	    if (rank_f(c_rank_f(data[i])[k]) > threshold) continue;
	    if (!(TISSUE_MAP[k] in retval)) {
		retval[TISSUE_MAP[k]] = {
		    name: TISSUE_MAP[k],
		    color: (TISSUE_MAP[k] in TissueColors ? TissueColors[TISSUE_MAP[k]] : "#000000"),
		    items: []
		};
	    }
	    retval[TISSUE_MAP[k]].items.push(rank_f(c_rank_f(data[i])[k]));
	}
    }
    return retval;
};

class ComparisonBarGraph extends React.Component {

    constructor(props) {
	super(props);
    }

    render() {
	return (<div style={{"width": "100%"}}>
		   <div className={"loading"}
		      style={{"display": (this.props.fetching ? "block" : "none")}}>
		         Loading...
		   </div>
		   <div style={{"width": "100%"}} ref="bargraph" />
		</div>);
    }

    componentDidUpdate() {
	var width = $(this.refs.bargraph).width();
	render(<HorizontalBar width={width} height={1000}
	          items={format_data_for_bar_graph(this.props.data, this.props.rank_type, this.props.threshold)}
	          barheight="12" rank_f={(d) => (d)} />,
	       this.refs.bargraph);
    }
    
    componentDidMount() {
	this.componentDidUpdate();
    }
}
export default ComparisonBarGraph;

const props_map = (f) => (_state) => {
    var state = f(_state);
    return {
	threshold: state.threshold,
	rank_type: state.rank_type,
	data: _state.results.hits
    };
};

const dispatch_map = (f, store) => (_dispatch) => {
    var dispatch = f(_dispatch);
    return {
	onChange: (threshold, rank_type) => {dispatch(
	    type: UPDATE_COMPARISON,
	    threshold,
	    rank_type
	)}
    };
};

export const MainComparisonConnector = (store) => (pf, df) => connect(props_map(pf), dispatch_map(df, store));
