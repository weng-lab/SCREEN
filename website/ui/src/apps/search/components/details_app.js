var React = require('react');
import {connect} from 'react-redux';

import ResultsTable from '../../../common/components/results_table'

class DetailsApp extends React.Component {

    constructor(props) {
	super(props);
    }

    render() {
	var tables = this.props.tables;
	var data = this.props.data;
	return (<div>
		    <h3>{this.props.q.accession}</h3>
		    {Object.keys(tables).map((key) => {
		        var table = tables[key];
		        return (<div className="col-md-3" key={key}>
				    <h4>{table.title}</h4>
				    <ResultsTable cols={table.cols} order={table.order} data={data[key]} /><br/>
				</div>);
		    })}
		    <br/>
		</div>);
    }
    
}
export default DetailsApp;

const props_map = (state) => {
    return {
	q: state.re_detail.q,
	data: state.re_detail.data
    };
};

export const details_connector = connect(props_map);
