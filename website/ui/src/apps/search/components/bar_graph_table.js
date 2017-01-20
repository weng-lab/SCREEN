var $ = require('jquery');
import React from 'react'
import {connect} from 'react-redux'
import {render} from 'react-dom'

import ResultsTable from '../../../common/components/results_table'
import HorizontalBars from '../../../common/components/horizontal_bars'
import {TissueColors} from '../config/colors'

import loading from '../../../common/components/loading'

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
        var n_data = [...this.props.data];
	return (<div style={{"width": "100%"}} ref="box">

                <div ref="bargraph">
                </div>

                <ResultsTable data={n_data}
                cols={this.props.cols}
		order={this.props.order}
                bFilter={false}
                info={false}
                paging={true}
		bLengthChange={this.props.bLengthChange}
		pageLength={this.props.pageLength}
                emptyText={""}
		/>

               </div>);
    }

    componentDidMount() {
	this.componentDidUpdate();
    }

    componentDidUpdate() {
	var width = $(this.refs.box).width();
	render(<HorizontalBars width={width} height={500}
	       items={format_data_for_bar_graph(this.props.data)}
	       barheight="5" rank_f={this.props.rank_f} />,
	       this.refs.bargraph);
    }
}

export default BarGraphTable;
