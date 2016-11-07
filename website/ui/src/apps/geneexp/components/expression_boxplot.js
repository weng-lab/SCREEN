var React = require('react')

import {render} from 'react-dom'
import {connect} from 'react-redux';
import {invalidate_results} from '../helpers/invalidate_results'
import HorizontalBars from '../../../common/components/horizontal_bar'

class ExpressionBoxplot extends React.Component {

    constructor(props) {
	super(props);
    }

    render() {
	return (<div>
		<div style={{"width": "100%"}} ref="bargraph" />
		</div>);
    }

    componentDidMount() {
	this.componentDidUpdate();
    }
    
    componentDidUpdate() {
	var width = 800;
	var height = 800;
	var barheight = "15";
	const rank_f = (d) => (d["rank"]);
		
	render(<HorizontalBars width={width} height={height} items={this.props.items}
	       loading={this.props.loading} barheight={barheight} rank_f={rank_f} />,
	       this.refs.bargraph);
    }
}

export default ExpressionBoxplot;

const props_map = (state) => {
    return {
	items: state.results.expression_boxplot.items,
	loading: state.results.expression_boxplot.fetching
    };
};

export const expression_boxplot_connector = connect(props_map);
