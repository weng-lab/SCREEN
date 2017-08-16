import * as Actions from './main_actions';

const mainTabSetter = (state, tabName) => {
    let ret = {maintabs_active: tabName};
    ret.maintabs = {...state.maintabs};
    ret.maintabs[tabName].visible = true;
    return ret;
}

const main_reducers = (state, action) => {
    switch (action.type) {
	case Actions.SHOW_MAIN_TABS:
            return {...state, maintabs_visible: action.show };

	case Actions.SET_MAIN_TAB:
            return {...state, ...mainTabSetter(state, action.name)};

	default:
	    return state;
    }
};

export default main_reducers;
