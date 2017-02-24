import * as Actions from '../actions/main_actions';
import * as SearchAction from '../../../common/actions/searchbox_actions.js'
import {doToggle} from '../../../common/utility'

const main_reducers = (state, action) => {
    switch (action.type) {

    case Actions.TOGGLE_COMPARTMENT: {
        return { ...state,
                 compartments_selected: doToggle(state.compartments_selected,
                                                 action.c)}
    }

    case Actions.TOGGLE_BIOSAMPLE_TYPE: {
        return { ...state,
                 biosample_types_selected: doToggle(state.biosample_types_selected,
                                                    action.bt)}
    }

    case SearchAction.MAKE_SEARCH_QUERY:
        console.log("new query", action.q);
        return state;

    default:
      return state;
  }
};

export default main_reducers;
