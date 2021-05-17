/*
 * SPDX-License-Identifier: MIT
 * Copyright (c) 2016-2020 Michael Purcaro, Henry Pratt, Jill Moore, Zhiping Weng
 */

import React from "react";
import { createStore, applyMiddleware } from "redux";
import { Provider } from "react-redux";
import thunkMiddleware from "redux-thunk";

import NavBarApp from "../../common/components/navbar_app";
import SearchBox from "../../common/components/searchbox";
import FacetBoxen from "./components/facetboxen";
import MainTabs from "./components/maintabs";

import main_reducers from "./reducers/main_reducers";
import initialState from "./config/initial_state";
import { PageTitle } from "../../common/utility";

class DePageInner extends React.Component {
  render() {
    let store = createStore(
      main_reducers,
      initialState(this.props.search, this.props.globals),
      applyMiddleware(thunkMiddleware)
    );
    const assembly = this.props.search.assembly;
    return (
      <Provider store={store}>
        <div>
          {PageTitle(assembly)}

          <nav
            id="mainNavBar"
            className="navbar navbar-default navbar-inverse navbar-main"
          >
            <div className="container-fluid" id="navbar-main">
              <NavBarApp
                assembly={assembly}
                show_cartimage={false}
                searchbox={SearchBox}
              />
            </div>
          </nav>

          <div className="container" style={{ width: "100%" }}>
            <div className="row" style={{ width: "100%" }}>
              <div className="col-md-3 nopadding-right" id="facets-container">
                <FacetBoxen assembly={assembly} globals={this.props.globals} />
              </div>
              <div className="col-md-9 nopadding-left" id="tabs-container">
                <MainTabs
                  assembly={assembly}
                  globals={this.props.globals}
                  search={this.props.search}
                />
              </div>
            </div>
          </div>
        </div>
      </Provider>
    );
  }
}

class DePage extends AppPageBase {
  constructor(props) {
    super(props, "/dews/search", DePageInner, {
      ct1: "C57BL/6_limb_embryo_11.5_days",
      ct2: "C57BL/6_limb_embryo_15.5_days",
    });
  }
}

export default DePage;
