var React = require('react')
import {connect} from 'react-redux';

import Tree from '../../../common/components/tree'
import {invalidate_results} from '../helpers/invalidate_results'
import {SET_TREE_FIELDS} from '../reducers/root_reducer'

class ResultsTree extends React.Component {

    constructor(props) {
	super(props);
    }

    onChange(s) {
	var p = s.split("$");
	if (this.props.onChange) this.props.onChange(p[0], p[1]);
    }
    
    render() {
	return (<div>
		   <select onChange={() => {this.onChange(this.refs.field.value)}} ref="field">
		      <option value="dnase">DNase</option>
		      <option value="promoter$H3K4me3-Only">H3K4me3 Only</option>
		      <option value="promoter$H3K4me3+DNase">H3K4me3 and DNase</option>
		      <option value="enhancer$H3K27ac-Only">H3K27ac Only</option>
		      <option value="enhancer$H3K27ac+DNase">H3K27ac and DNase</option>
		      <option value="CTCF$CTCF-Only">CTCFOnly</option>
		      <option value="CTCF$CTCF+DNase">CTCF and DNase</option>
		   </select>
		   <Tree data={this.props.data} width={2500} height={3000} labels={this.props.labels} />;
		</div>);
    }
    
};
export default ResultsTree;
    
const props_map = (f) => (_state) => {
    var state = f(_state);
    return {
	data: state.tree,
	labels: state.labels
    };
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
	}
    };
};

export const tree_connector = (store) => (pf, df) => connect(props_map(pf), dispatch_map(store)(df));
