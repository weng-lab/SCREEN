import * as Actions from '../actions/main_actions';

const main_reducers = (state, action) => {
    switch (action.type) {

    case Actions.SET_MAIN_TAB:
        var ret = {...state, maintabs_active: action.name}
        ret.maintabs = {...state.maintabs};
        ret.maintabs[action.name].visible = true;
        return ret;

    case Actions.SET_LOADING:
	return {...state, needreload: false};

    case Actions.SET_CHROMOSOME:
	return {...state, chr: action.chr};

    case Actions.SET_BIOSAMPLE:
	return {...state, biosample: action.biosample};

    default:
      return state;
  }
};

export default main_reducers;
