var React = require('react')
import {connect} from 'react-redux';

import Tree from '../../../common/components/tree'

class ResultsTree extends React.Component {

    constructor(props) {
	super(props);
    }

    render() {
	return <Tree data={this.props.data} width={2500} height={3000} labels={this.props.labels} />;
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

export const tree_connector = (pf) => connect(props_map(pf));
