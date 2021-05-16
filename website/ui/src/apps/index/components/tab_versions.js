/*
 * SPDX-License-Identifier: MIT
 * Copyright (c) 2016-2020 Michael Purcaro, Henry Pratt, Jill Moore, Zhiping Weng
 */

import React from "react";

import { tabPanelize } from "../../../common/utility";

import TabDataScreen from "./tab_versions_screen";

class TabVersions extends React.Component {
  key = "versions";

  render() {

    return tabPanelize(
      <div>
        <TabDataScreen />
      </div>
    );
  }
}

export default TabVersions;
