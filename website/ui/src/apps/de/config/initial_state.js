/*
 * SPDX-License-Identifier: MIT
 * Copyright (c) 2016-2020 Michael Purcaro, Henry Pratt, Jill Moore, Zhiping Weng
 */

import MainTabInfo from "./maintabs.js";

const initialState = (search, globals) => {
  const parsedQuery = search.parsedQuery;

  return {
    ...parsedQuery,
    maintabs: MainTabInfo(),
    maintabs_active: "de_expression",
    maintabs_visible: true,
    ct1: search.ct1,
    ct2: search.ct2,
    gene: search.gene,
    des: null,
  };
};

export default initialState;
