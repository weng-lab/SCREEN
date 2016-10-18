var React = require('react');

import ResultsTable, {table_connector} from './results_table'
import ResultsTableColumns, {table_order} from '../config/results_table'

import create_table from '../../search/helpers/create_table'

import invalidate_results from '../helpers/invalidate_results'

class ResultsApp extends React.Component {

    constructor(props) {
	super(props);
    }

    render() {
	var Retval = table_connector(ResultsTable);
	return <Retval store={this.props.store} />;
    }

    componentWillMount() {
	create_table(this.props.store.dispatch)(ResultsTableColumns, table_order);
    }

    componentDidMount() {
	
    }
    
}
export default ResultsApp;
