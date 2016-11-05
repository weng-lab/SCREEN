import {get_root_reducer} from '../../search/reducers/root_reducer'
import VennReducer from './venn_reducer'
import {venn_connector} from '../components/venn'

export const main_venn_connector = venn_connector((state) => (state.venn));

export const get_root_comparison_reducer = (tabs) => {
    var root_reducer = get_root_reducer(tabs);
    return (state = Object.assign({}, root_reducer(), {venn: VennReducer()}), action) => {
	var n_state = root_reducer(state, action);
	return Object.assign(n_state, {
	    venn: VennReducer(n_state.venn, action)
	});
    };
};
