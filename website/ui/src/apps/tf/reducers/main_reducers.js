import * as Actions from '../actions/main_actions';
import * as SearchAction from '../../../common/actions/searchbox_actions.js'
import {doToggle} from '../../../common/uility'

const main_reducers = (state, action) => {
    switch (action.type) {

    case Actions.SET_MAIN_TAB:
        var ret = {...state, maintabs_active: action.name}
        ret.maintabs = {...state.maintabs};
        ret.maintabs[action.name].visible = true;
        return ret;

    case Actions.SET_CT1: {
	var ct1 = new Set(state.ct1);
	if (ct1.has(action.ct)) {
	    ct1.delete(action.ct);
	} else {
	    ct1.add(action.ct);
	}
        return {...state, ct1};
    }
    case Actions.SET_CT2: {
	var ct2 = new Set(state.ct2);
	if (ct2.has(action.ct)) {
	    ct2.delete(action.ct);
	} else {
	    ct2.add(action.ct);
	}
	return {...state, ct2};
    }

    case SearchAction.MAKE_SEARCH_QUERY:
        console.log("new query", action.q);
        return state;

    default:
      return state;
  }
};

export default main_reducers;
