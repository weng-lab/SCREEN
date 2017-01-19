var $ = require('jquery');
const React = require('react');
import {connect} from 'react-redux'
import {render} from 'react-dom'

import ResultsTable from '../../../common/components/results_table'
import HorizontalBars from '../../../common/components/horizontal_bars'
import {TissueColors} from '../config/colors'

import loading from '../components/loading'

const format_data_for_bar_graph = (data) => {
    var retval = {};
    for (var i in data) {
	if (data[i].tissue == "") continue;
	if (!(data[i].tissue in retval)) {
	    retval[data[i].tissue] = {
		name: data[i].tissue,
		color: (data[i].tissue in TissueColors ? TissueColors[data[i].tissue] : "#000000"),
		items: []
	    };
	}
	retval[data[i].tissue].items.push(data[i]);
    }
    return retval;
};

class BarGraphTable extends React.Component {
    render() {
	return (<div style={{"width": "100%"}} ref="bargraph">

		<ResultsTable data={n_data} cols={this.props.cols}
                onTdClick={this.props.onTdClick}
	        loading={this.props.fetching}
                onButtonClick={this.props.onButtonClick}
		order={this.props.order} bFilter={this.props.bFilter}
		bLengthChange={this.props.bLengthChange}
		pageLength={this.props.pageLength}
		/>

		</div>);
    }

    componentDidUpdate() {
	var width = $(this.refs.bargraph).width();
	render(<HorizontalBars width={width} height={500}
	       items={format_data_for_bar_graph(this.props.data)}
	       barheight="5" rank_f={this.props.rank_f} />,
	       this.refs.bargraph);
    }

    componentDidMount() {
	this.componentDidUpdate();
    }
}

export default BarGraphTable;
