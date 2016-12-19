var React = require('react')

import {render} from 'react-dom'
import {connect} from 'react-redux';
import {invalidate_results} from '../helpers/invalidate_results'
import LargeHorizontalBars from './large_horizontal_bars'

import REComponent from '../../../common/components/re_component'

class ExpressionBoxplot extends REComponent {

    constructor(props) {
	super(props);
    }

    render() {
	return super.render(<div>
 	                       <span style={{fontSize: "18pt"}}>{this.props.gene_name} <span ref="help_icon" /></span>
		               <div style={{"width": "100%"}} ref="bargraph" />
		            </div>);
    }

    componentDidMount() {
	super.componentDidMount();
	this.componentDidUpdate();
    }
    
    componentDidUpdate() {

	super.componentDidUpdate();
	
	var width = 800;
	var barheight = "15";
		
	render(<LargeHorizontalBars width={width} items={this.props.items}
	       loading={this.props.loading} barheight={barheight} />,
	       this.refs.bargraph);
    }
}

export default ExpressionBoxplot;

const props_map = (state) => {
    return {
	items: state.results.expression_boxplot.items,
	loading: state.results.expression_boxplot.fetching,
	gene_name: state.results.expression_boxplot.gene_name,
	helpkey: "gene_expression_barplot"
    };
};

export const expression_boxplot_connector = connect(props_map);
