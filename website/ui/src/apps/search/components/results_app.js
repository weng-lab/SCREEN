var React = require('react');

import TableWithCart, {table_connector} from './table_with_cart'
import ResultsTableColumns, {table_order} from '../config/results_table'

import create_table from '../helpers/create_table'

class ResultsApp extends React.Component {

    constructor(props) {
	super(props);
    }

    render() {
	var Retval = table_connector(TableWithCart);
	return <Retval store={this.props.store} />;
    }

    componentWillMount() {
	create_table(this.props.store.dispatch)(ResultsTableColumns, table_order);
    }
    
}
export default ResultsApp;

