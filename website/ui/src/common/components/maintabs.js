/*
 * SPDX-License-Identifier: MIT
 * Copyright (c) 2016-2020 Michael Purcaro, Henry Pratt, Jill Moore, Zhiping Weng
 */

import React from "react";

class MainTabs extends React.Component {
  render() {
    const makeTabTitle = (key, tab) => {
      let active = key === this.props.maintabs_active;
      if (!tab.visible && !active) {
        return <li key={"tab_" + key} />;
      }
      return (
        <li
          className={active ? "active" : ""}
          key={"tab_" + key}
          onClick={() => {
            this.props.actions.setMainTab(key);
          }}
        >
          <a data-toggle="tab">{tab.title}</a>
        </li>
      );
    };

    const makeTab = (key, tab) => {
      let active = key === this.props.maintabs_active;
      if (!tab.visible && !active) {
        return <div key={"tab_" + key} />;
      }
      return (
        <div
          className={active ? "tab-pane active" : "tab-pane"}
          id={"tab_main_" + key}
          key={"tcontent_" + key}
        >
          {React.createElement(tab.f, this.props)}
        </div>
      );
    };

    let tabs = this.props.maintabs;
    let mainDivId = this.props.mainDivId || "exTab1";
    let mainDivClass = this.props.mainDivClass || "container";
    let tabUlClass = this.props.tabUlClass || "nav-tabs";
    return (
      <div id={mainDivId} className={mainDivClass}>
        <ul className={"nav " + tabUlClass}>
          {Object.keys(tabs).map((key) => makeTabTitle(key, tabs[key]))}
        </ul>

        <div className="tab-content clearfix">
          {Object.keys(tabs).map((key) => makeTab(key, tabs[key]))}
        </div>
      </div>
    );
  }
}
export default MainTabs;
