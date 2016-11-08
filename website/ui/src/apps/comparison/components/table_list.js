import ResultsDataTable from '../../../common/components/results_table'

import {numberWithCommas} from '../../../common/common'
import {connect} from 'react-redux'

class TableList extends React.Component {

    constructor(props) {
	super(props);
    }

    render() {
	var tables = this.props.tables.map((t, i) => {
	    var total = (t.data.length < t.total
			 ? "displaying top " + t.data.length + " results of " + numberWithCommas(t.total) + " total"
			 : "found " + t.total + " results");
	    return (<div>
		       <h3>{t.title}</h3>
		       <ResultsDataTable data={t.data} cols={t.cols} onTdClick={this.props.onTdClick} loading={this.props.loading}
	                  order={t.order} bFilter={true} bLengthChange={true} />
		       <span className="tableInfo">{total}</span>
                    </div>);
	});
	return <div>{tables}</div>;
    }
    
}
export default TableList;

const props_map = (f) => (_state) => {
    var state = f(_state);
    return {
	tables: state.tables,
	loading: state.loading
    };
};

const dispatch_map = (f) => (_dispatch) => {
    var dispatch = f(_dispatch);
};

export const tablelist_connector = (pf, df) => connect(props_map(pf), dispatch_map(df));
