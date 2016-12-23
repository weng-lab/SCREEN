var React = require('react')
import {connect} from 'react-redux';

import Tree from '../../../common/components/tree'
import {invalidate_results, invalidate_tree_comparison} from '../helpers/invalidate_results'
import {SET_TREE_FIELDS} from '../reducers/root_reducer'

import REComponent from '../../../common/components/re_component'

import {primary_cell_label_formatter} from '../config/colors'

const default_label_formatter = (l) => {
    return {
	name: l
    };
};

class ResultsTree extends REComponent {

    constructor(props) {
	super(props);
	this._on_click = this._on_click.bind(this);
    }

    onChange(s) {
	var p = s.split("$");
	if (this.props.onChange) {
	    this.props.onChange(p[0], p[1]);
	}
    }

    _on_click(d) {
	if (this.props.onClick) {
	    this.props.onClick(d);
	}
    }
    
    render() {
	var _formatter = (this.props.label_formatter ? this.props.label_formatter : default_label_formatter);
	var tr = this.props.tree_results;
	var title = this.props.tree_title;
	var trees = (tr ? Object.keys(tr).map((k) => {
	    var formatter = (k == "primary cell" ? primary_cell_label_formatter : _formatter);
	    var labels = (tr[k].labels ? tr[k].labels.map(formatter) : null);
	    var height = (labels ? labels.length * 15 : 0);
	    return <div ref="container"><h1>{title}</h1><h2>{k}</h2><Tree data={tr[k].tree} width={2000} height={height} labels={labels} onClick={this._on_click} /></div>;
	}) : "");
	return super.render(<div>
		   <select onChange={() => {$(this.refs.container).empty(); this.onChange(this.refs.field.value)}} ref="field">
		      <option value="dnase">DNase</option>
		      <option value="promoter$H3K4me3-Only">H3K4me3 Only</option>
		      <option value="promoter$DNase+H3K4me3">H3K4me3 and DNase</option>
		      <option value="enhancer$H3K27ac-Only">H3K27ac Only</option>
		      <option value="enhancer$DNase+H3K27ac">H3K27ac and DNase</option>
		      <option value="ctcf$CTCF-Only">CTCF Only</option>
		      <option value="ctcf$DNase+CTCF">CTCF and DNase</option>
	           </select>
	           <span ref="help_icon" />
		   {trees}
		</div>);
    }

    componentDidMount() {
	super.componentDidMount();
    }

    componentDidUpdate() {
	super.componentDidUpdate();
    }
    
};
export default ResultsTree;
    
const props_map = (f) => (_state) => {
    var state = f(_state);
    return Object.assign({}, state, {
	helpkey: "celltype_tree"
    });
};

const dispatch_map = (store) => (f) => (_dispatch) => {
    var dispatch = f(_dispatch);
    return {
	onChange: (outer, inner) => {
	    dispatch({
		type: SET_TREE_FIELDS,
		outer,
		inner
	    });
	    dispatch(invalidate_results(store.getState()));
	},
	onClick: (d) => {
	    dispatch(invalidate_tree_comparison({
		left: d.children[0],
		right: d.children[1]
	    }));
	}
    };
};

export const tree_connector = (store) => (pf, df) => connect(props_map(pf), dispatch_map(store)(df));
