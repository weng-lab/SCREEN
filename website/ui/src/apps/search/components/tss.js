var React = require('react')
import {connect} from 'react-redux'

import REComponent from '../../../common/components/re_component'
import ExpressionBoxplot from '../../geneexp/components/expression_boxplot'

class TSSExpressionPlot extends REComponent {

    constructor(props) {
	super(props);
    }
    
    render() {
	if (!this.props.items || this.props.items.length == 0) {
	    return super.render(<div>This regulatory element does not have any associated transcription start sites.</div>);
	}
	return super.render(<ExpressionBoxplot items={this.props.items} gene_name={this.props.gene_name} loading={this.props.loading} />);
    }

    componentDidUpdate() {
	super.componentDidUpdate();
    }

    componentDidMount() {
	super.componentDidMount();
    }
    
}
export default TSSExpressionPlot;

export const props_map = (f) => (_state) => {
    var state = f(_state);
    return {
	items: state.items,
	gene_name: state.gene_name,
	loading: state.fetching
    };
};

export const tss_connector = (pf) => connect(props_map(pf));
