import * as Actions from '../actions/main_actions';
import * as SearchAction from '../../../common/actions/searchbox_actions.js'

const doToggle = (oldSet, item) => {
    let ret = new Set(oldSet);
    if(ret.has(item)){
        ret.delete(item);
    } else {
        ret.add(item);
    }
    return ret;
}

const main_reducers = (state, action) => {
    switch (action.type) {

    case Actions.TOGGLE_COMPARTMENT: {
        return { ...state,
                 compartments: doToggle(state.compartments, action.c)}
    }

    case SearchAction.MAKE_SEARCH_QUERY:
        console.log("new query", action.q);
        return state;

    default:
      return state;
  }
};

export default main_reducers;
