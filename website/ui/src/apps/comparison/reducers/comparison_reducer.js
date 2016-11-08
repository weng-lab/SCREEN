import {get_root_reducer} from '../../search/reducers/root_reducer'
import VennReducer from './venn_reducer'
import ResultsReducer, {default_formatter} from './results_reducer'
import {venn_connector} from '../components/venn'
import {tablelist_connector} from '../components/table_list'

import ResultsTableColumns, {table_order} from '../../search/config/results_table'

export const main_venn_connector = venn_connector((state) => (state.venn));
export const main_results_connector = tablelist_connector((state) => (state.results), (dispatch) => (dispatch));

const table_layout = {
    cols: ResultsTableColumns,
    order: table_order
};

export const get_root_comparison_reducer = (tabs) => {
    var root_reducer = get_root_reducer(tabs);
    var results_reducer = ResultsReducer(default_formatter(table_layout));
    var default_state = Object.assign({}, root_reducer());
    default_state = Object.assign(default_state, {
	results: Object.assign(default_state.results, results_reducer()),
	venn: VennReducer()
    });
    return (state = default_state, action) => {
	var n_state = root_reducer(state, action);
	return Object.assign(n_state, {
	    venn: VennReducer(n_state.venn, action),
	    results: results_reducer(n_state.results, action)
	});
    };
};
