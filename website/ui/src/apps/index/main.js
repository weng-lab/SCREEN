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

const Footer = () => (
  <Segment>
    <Container textAlign="center">
      &copy; 2016-2021 Weng Lab @ UMass Med, ENCODE Data Analysis Center
    </Container>
  </Segment>
);

const Title = () => (
  <Header as='h1' textAlign={"center"}>
  {"SCREEN: Search Candidate cis-Regulatory Elements by ENCODE"}
  </Header>
)

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
          <Title />

          <Router>
            <HeaderMenu onItemClick={item => this.onItemClick(item)}
              items={[
                ["Overview", "/"],
                ["About", "/about"],
                ["UCSC Genome Browser", "/ucsc"],
                ["Tutorials", "/tutorials"],
                ["Downloads", "/downloads"],
                ["Versions", "/versions"],
                ["Query Results", "query"]
              ]} />


            <Switch>
              <Route path="/" exact component={TabOverview} />
              <Route path="/about" component={TabAbout} />
              <Route path="/ucsc" component={TabUCSC} />
              <Route path="/tutorials" component={TabTutorial} />
              <Route path="/downloads" component={TabDownloads} />
              <Route path="/versions" component={TabVersions} />
              <Route path="/query" component={TabQuery} />
            </Switch>
          </Router>
          <Footer />
        </Container>
      </Provider>
    );
  }
}

export default IndexPage;
