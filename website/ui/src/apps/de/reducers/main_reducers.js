/*
 * SPDX-License-Identifier: MIT
 * Copyright (c) 2016-2020 Michael Purcaro, Henry Pratt, Jill Moore, Zhiping Weng
 */

import * as Actions from "../actions/main_actions";
import * as SearchAction from "../../../common/actions/searchbox_actions.js";

const main_reducers = (state, action) => {
  switch (action.type) {
    case Actions.SET_MAIN_TAB:
      var ret = { ...state, maintabs_active: action.name };
      ret.maintabs = { ...state.maintabs };
      ret.maintabs[action.name].visible = true;
      return ret;

    case Actions.SET_CT1: {
      return { ...state, ct1: action.ct };
    }
    case Actions.SET_CT2: {
      return { ...state, ct2: action.ct };
    }

    case Actions.SET_DES: {
      return { ...state, des: action.des };
    }

    case SearchAction.MAKE_SEARCH_QUERY:
      console.log("new query", action.q);
      return state;

    default:
      return state;
  }
};

export default main_reducers;
