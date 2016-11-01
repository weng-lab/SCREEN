export const SELECT_TAB = 'SELECT_TAB';
export const SHOW_TAB = 'SHOW_TAB';
export const HIDE_TAB = 'HIDE_TAB';

const set_tab_visibility = (state, target, value) => {
    if (!(target in state.tabs)) return state;
    var n_state = Object.assign({}, state);
    n_state.tabs[target].visible = value;
    return n_state;
};

const TabReducer = (state, action) => {

    //console.log(action);
    
    switch (action.type) {

    case SELECT_TAB:
	return (action.selection in state.tabs
		? Object.assign({}, set_tab_visibility(state, action.selection, true), {
		    selection: action.selection
		})
		: state);
	
    case HIDE_TAB:
	return set_tab_visibility(state, target, false);

    case SHOW_TAB:
	return set_tab_visibility(state, target, true);
	
    }
    
    return state;
    
};
export default TabReducer;
