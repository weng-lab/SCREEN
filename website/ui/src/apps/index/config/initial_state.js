/*
 * SPDX-License-Identifier: MIT
 * Copyright (c) 2016-2020 Michael Purcaro, Henry Pratt, Zhiping Weng
 */

import MainTabsConfig from '../config/maintabs_config'

const initialState = (tab) => {
    let mainTab = tab || "main";
    return {
        maintabs: MainTabsConfig(),
        maintabs_active: mainTab,
        maintabs_visible: true,
        genes: null
    };
}

export default initialState;
