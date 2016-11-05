export const SELECT_TAB = 'SELECT_TAB';

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
    }
    
    return state;
    
};
export default TabReducer;
