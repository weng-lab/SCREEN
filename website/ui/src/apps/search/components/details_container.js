/*
 * SPDX-License-Identifier: MIT
 * Copyright (c) 2016-2020 Michael Purcaro, Henry Pratt, Jill Moore, Zhiping Weng
 */

import React from "react";
import { connect } from "react-redux";
import { bindActionCreators } from "redux";

import * as Actions from "../actions/main_actions";
import * as Render from "../../../common/zrenders";
import { Container, Tab } from "semantic-ui-react";

class DetailsContainer extends React.Component {
  render() {
    const makeTab = (key, tab) => {
      let active = key === this.props.re_details_tab_active;
      if (!tab.enabled && !active) {
        return <div key={key} />;
      }
      return (
        <div
          className={active ? "tab-pane active" : "tab-pane"}
          id={"tab_" + key}
          key={"tpane_" + key}
        >
          {React.createElement(tab.f, this.props)}
        </div>
      );
    };

    let tabs = this.props.tabs;

    // TODO: avoid multiple re-renders?
    // console.log(this.props);
    let cre = this.props.active_cre;

    console.log(tabs);

    return (
      <div>
        {Render.creTitle(this.props.globals, cre)}
        <Tab renderActiveOnly panes={tabs} />
      </div>
    );
  }
}

const mapStateToProps = (state) => ({ ...state });
const mapDispatchToProps = (dispatch) => ({
  actions: bindActionCreators(Actions, dispatch),
});
export default connect(mapStateToProps, mapDispatchToProps)(DetailsContainer);
