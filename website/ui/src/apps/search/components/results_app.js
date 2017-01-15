import React from 'react'

import TableWithCart from './table_with_cart'
import ResultsTableColumns, {table_order} from '../config/results_table'

class ResultsApp extends React.Component {
    constructor(props) {
	super(props);
    }

    render() {
	return (<TableWithCart data={[]}
                total={0}
                order={table_order} cols={ResultsTableColumns} />);
    }
}

export default ResultsApp;

