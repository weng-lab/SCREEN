/*
 * SPDX-License-Identifier: MIT
 * Copyright (c) 2016-2020 Michael Purcaro, Henry Pratt, Jill Moore, Zhiping Weng
 */

const initialState = (tab) => {
  let mainTab = tab || "main";
  return {
    maintabs_active: mainTab,
    maintabs_visible: true,
    genes: null,
  };
};

export default initialState;
