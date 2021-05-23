/*
 * SPDX-License-Identifier: MIT
 * Copyright (c) 2016-2020 Michael Purcaro, Henry Pratt, Jill Moore, Zhiping Weng
 */

import React from "react";
import { BrowserRouter as Router, Route, Switch } from "react-router-dom";
import { createStore, applyMiddleware } from "redux";
import { Provider } from "react-redux";
import thunkMiddleware from "redux-thunk";
import { Segment, Container, Header } from "semantic-ui-react";

import HeaderMenu from "./headerMenu";

import TabOverview from "./components/tab_overview";
import TabAbout from "./components/tab_about";
import TabTutorial from "./components/tab_tutorial";
import TabUCSC from "./components/tab_ucsc";
import TabQuery from "./components/tab_query";
import TabVersions from "./components/tab_versions";
import TabDownloads from "./components/tab_downloads";

import { PageTitle } from "../../common/utility";

import reducers from "./reducers";
import initialState from "./config/initial_state";

class IndexPage extends React.Component {
  render() {

    const store = createStore(
      reducers,
      initialState(null),
      applyMiddleware(thunkMiddleware)
    );

    return (
      <Provider store={store}>
        <Container>
          {PageTitle()}

          <Header as='h1' textAlign={"center"}>
            {"SCREEN: Search Candidate cis-Regulatory Elements by ENCODE"}
          </Header>

          <Router>
            <HeaderMenu onItemClick={item => this.onItemClick(item)}
              items={[
                ["Overview", "/"],
                ["About", "/index/about"],
                ["UCSC Genome Browser", "/index/ucsc"],
                ["Tutorials", "/index/tutorials"],
                ["Downloads", "/index/downloads"],
                ["Versions", "/index/versions"],
                ["Query Results", "/index/query"]
              ]} />

            <Switch>
              <Route path="/" exact><TabOverview /></Route>
              <Route path="/index/about"><TabAbout /></Route>
              <Route path="/index/ucsc"><TabUCSC /></Route>
              <Route path="/index/tutorials"><TabTutorial /></Route>
              <Route path="/index/downloads"><TabDownloads /></Route>
              <Route path="/index/versions"><TabVersions /></Route>
              <Route path="/index/query"><TabQuery /></Route>
            </Switch>
          </Router>

          <Segment>
            <Container textAlign="center">
              &copy;{"2016-2021 Weng Lab @ UMass Med, ENCODE Data Analysis Center"}
            </Container>
          </Segment>

        </Container>
      </Provider>
    );
  }
}

export default IndexPage;
