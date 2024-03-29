/*
 * SPDX-License-Identifier: MIT
 * Copyright (c) 2016-2020 Michael Purcaro, Henry Pratt, Jill Moore, Zhiping Weng
 */

import React from "react"
import { createStore, applyMiddleware } from "redux"
import { Provider } from "react-redux"
import thunkMiddleware from "redux-thunk"

import MainTabs from "./components/maintabs"

import reducers from "./reducers"
import initialState from "./config/initial_state"
// import {PageTitle} from '../../common/utility' never used
import { Icon } from "semantic-ui-react"

class IndexPage extends React.Component {
  footer() {
    return (
      <div id="footer">
        <center>&copy; 2016-{new Date().getFullYear()} Weng Lab @ UMass Med, ENCODE Data Analysis Center</center>
      </div>
    )
  }

  title() {
    return (
      <div className={"container-fluid"}>
        <div className={"row"}>
          <div className={"col-md-12"}>
            <div id={"mainTitle"}>{"SCREEN: Search Candidate cis-Regulatory Elements by ENCODE"}</div>
            <h4 style={{ textAlign: "center", marginTop: "-0.2em" }}>
              Registry of cCREs V3{" "}
              <a href="/index/cversions" title="click for more information">
                <Icon name="info circle" />
              </a>
            </h4>
          </div>
        </div>
      </div>
    )
  }

  render() {
    let tab = null
    if ("tab" in this.props.params) {
      tab = this.props.params.tab
    }

    const store = createStore(reducers, initialState(tab), applyMiddleware(thunkMiddleware))
    return (
      <Provider store={store}>
        <div>
          {tab === null && this.title()}
          <MainTabs uuid={this.props.uuid} mainDivId={"mainTabs"} tabUlClass={"nav-pills"} />
          {this.footer()}
        </div>
      </Provider>
    )
  }
}

export default IndexPage
