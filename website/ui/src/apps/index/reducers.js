/*
 * SPDX-License-Identifier: MIT
 * Copyright (c) 2016-2020 Michael Purcaro, Henry Pratt, Zhiping Weng
 */

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
