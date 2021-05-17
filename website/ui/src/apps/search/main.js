/*
 * SPDX-License-Identifier: MIT
 * Copyright (c) 2016-2020 Michael Purcaro, Henry Pratt, Jill Moore, Zhiping Weng
 */

import React, { useEffect, useState } from "react";
import { createStore, applyMiddleware } from "redux";
import { Provider } from "react-redux";
import { BrowserRouter as Router, Route, Switch, useLocation, useParams } from "react-router-dom";
import thunkMiddleware from "redux-thunk";

import queryString from 'query-string'
import { v4 as uuidv4 } from "uuid";

import NavBarApp from "../../common/components/navbar_app";
import SearchBox from "../../common/components/searchbox";
import FacetBoxen from "./components/facetboxen";

import { isCart, PageTitle } from "../../common/utility";

import main_reducers from "./reducers/main_reducers";
import initialState from "./config/initial_state";

import HeaderMenu from "./headerMenu";

import BedUpload from "./components/bed_upload";
import ConfigureGenomeBrowser from "./components/configure_genome_browser";
import DetailsContainer from "./components/details_container";
import DetailsTabInfo from "./config/details";
import GeneExp from "../geneexp/components/gene_exp";
import RampagePlot from "./components/rampage_plot";

import * as Render from "../../common/zrenders";
import { Servers } from "../../common/api_client";

import ResultsTab from "./results_tab";

class DetailsTab extends React.Component {
  render() {
    return React.createElement(DetailsContainer, {
      ...this.props,
      tabs: DetailsTabInfo(this.props.assembly),
    });
  }
}

class SearchPageInner extends React.Component {
  render() {
    const { search, globals, query } = this.props;
    const { uuid, parsedQuery } = search;
    const { assembly, genes } = parsedQuery;

    let store = createStore(
      main_reducers,
      initialState(globals, parsedQuery, uuid),
      applyMiddleware(thunkMiddleware)
    );

    const gene = genes.length > 0 ? genes[0].approved_symbol : null;
    const geTitle = gene ? Render.tabTitle([gene, "Gene Expression"]) : "";
    const rTitle = gene ? Render.tabTitle([gene, "RAMPAGE"]) : "";
    const showRampage = "mm10" !== assembly && !!gene;
    const showCart = "cart" in query;

    let resultsTitle = showCart ? "cCREs in Cart" : Render.tabTitle(["cCRE", "Search Results"]);

    return (
      <Provider store={store}>
        <div>
          {PageTitle(assembly)}

          <NavBarApp assembly={assembly} uuid={uuid} show_cartimage={true} searchbox={SearchBox} />

          <Router>
            <HeaderMenu onItemClick={item => this.onItemClick(item)}
              items={[
                ["cCRE Search Results", "/search/"  + "?" + queryString.stringify(query), true],
                ["Bed Upload", "/search/bedupload/" + "?" + queryString.stringify(query), true],
                [geTitle, "/search/geneexpression/", !!gene],
                [rTitle, "/search/rampage/", showRampage],
                ["cCRE Details", "/search/ccre/", false],
                ["Configure Genome Browser", "/search/genomebrowser/", false],
              ]} />

            <Switch>
              <Route path="/search" exact><ResultsTab {...this.props} {...{ assembly, showCart }} /></Route>
              <Route path="/search/bedupload"><BedUpload {...this.props} {...{ assembly, showCart }}/></Route>
              <Route path="/search/geneexpression"><GeneExp {...this.props} {...{ gene }} /></Route>
              <Route path="/search/rampage"><RampagePlot {...this.props} {...{ gene }} /></Route>
              <Route path="/search/ccre"><DetailsTab /></Route>
              <Route path="/search/genomebrowser"><ConfigureGenomeBrowser /></Route>
            </Switch>
          </Router>
        </div>
      </Provider>
    );
  }
}

const SearchPage = () => {
  const loc = useLocation();
  const query = queryString.parse(loc.search);
  const { assembly } = query;

  // figure out UUID
  let [uuid, setUuid] = useState("uuid" in query && "undefined" !== query.uuid ? query["uuid"] : uuidv4());

  // load globals
  let [globals, setGlobals] = useState(null);
  useEffect(() => {
    fetch(Servers("/globalData/0/") + assembly)
      .then(response => response.json())
      .then(data => setGlobals(data))
  }, [assembly]);

  // have webservice parse the query from the URL
  let [search, setSearch] = useState(null);
  const jq = JSON.stringify({ ...query, uuid });
  useEffect(() => {
    const url = Servers("/searchws/search");
    fetch(url, { headers: { "Accept": "application/json", "Content-Type": "application/json", }, method: "POST", body: jq })
      .then(response => response.json())
      .then(data => setSearch(data))
  }, [jq]);

  return (
    <div>
      {(null === globals || null === search) && <div className="loading"></div>}
      {globals && search && (<SearchPageInner {...{ globals, search, query }} />)}
    </div>
  );
}

export default SearchPage;
