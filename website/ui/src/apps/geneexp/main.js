/*
 * SPDX-License-Identifier: MIT
 * Copyright (c) 2016-2020 Michael Purcaro, Henry Pratt, Jill Moore, Zhiping Weng
 */

import React from "react";
import { createStore, applyMiddleware } from "redux";
import { Provider } from "react-redux";
import thunkMiddleware from "redux-thunk";

import NavBarApp from "../../common/components/navbar_app";
import MainTabs from "./components/maintabs";

import main_reducers from "./reducers/main_reducers";

import initialState from "./config/initial_state";
import { PageTitle } from "../../common/utility";

class GeneExpPageInner extends React.Component {
  render() {
    const store = createStore(
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
                uuid={this.props.uuid}
                show_cartimage={false}
              />
            </div>
          </nav>

          <div className="container" style={{ width: "100%" }}>
            <div className="row">
              <div className="col-md-12" id="tabs-container">
                <MainTabs
                  assembly={assembly}
                  gene={this.props.search.gene}
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

class GeneExpPage extends AppPageBase {
  constructor(props) {
    super(props, "/gews/search", GeneExpPageInner, {
      compartments_selected: ["cell"],
      biosample_types_selected: [
        "cell line",
        "induced pluripotent stem cell line",
        "in vitro differentiated cells",
        "primary cell",
        "stem cell",
        "tissue",
      ],
    });
  }
}

export default GeneExpPage;
