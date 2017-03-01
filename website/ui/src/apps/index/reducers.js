import * as Actions from './actions';

const reducers = (state, action) => {
    switch (action.type) {

	case Actions.SET_MAIN_TAB:
            var ret = {...state, maintabs_active: action.name}
            ret.maintabs = {...state.maintabs};
            ret.maintabs[action.name].visible = true;
            return ret;

    default:
      return state;
  }
};

export default reducers;
