import * as Actions from './actions';

const reducers = (state, action) => {
    switch (action.type) {

	case Actions.SET_MAIN_TAB:
            var ret = {...state, maintabs_active: action.name}
            ret.maintabs = {...state.maintabs};
            ret.maintabs[action.name].visible = true;
            return ret;

	case Actions.SET_GENES:
            return {...state, genes: action.genes};

    default:
      return state;
  }
};

export default reducers;
