/*
 * SPDX-License-Identifier: MIT
 * Copyright (c) 2016-2020 Michael Purcaro, Henry Pratt, Jill Moore, Zhiping Weng
 */

import React, { useEffect, useState } from "react";
import { createStore, applyMiddleware } from "redux";
import { Provider } from "react-redux";
import { useLocation } from "react-router-dom";
import thunkMiddleware from "redux-thunk";

import queryString from 'query-string'
import { v4 as uuidv4 } from "uuid";

import NavBarApp from "../../common/components/navbar_app";
import SearchBox from "../../common/components/searchbox";

import { PageTitle } from "../../common/utility";

import main_reducers from "./reducers/main_reducers";
import initialState from "./config/initial_state";

import SearchTabs from "./search_tabs";
import { Servers } from "../../common/api_client";


class SearchPageInner extends React.Component {
  render() {
    const { search, globals, query } = this.props;
    const { uuid, parsedQuery } = search;
    const { assembly } = parsedQuery;

    let store = createStore(
      main_reducers,
      initialState(globals, parsedQuery, uuid),
      applyMiddleware(thunkMiddleware)
    );

    return (
      <Provider store={store}>
        <div>
          {PageTitle(assembly)}

          <NavBarApp assembly={assembly} uuid={uuid} show_cartimage={true} searchbox={SearchBox} />

          <SearchTabs {...this.props} />

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
