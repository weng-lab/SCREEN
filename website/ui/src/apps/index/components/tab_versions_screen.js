/*
 * SPDX-License-Identifier: MIT
 * Copyright (c) 2016-2020 Michael Purcaro, Henry Pratt, Jill Moore, Zhiping Weng
 */

import React, { useMemo, useCallback, useRef, useEffect, useState } from "react";

import { Message } from "semantic-ui-react";
import { Tabs, Tab } from "react-bootstrap";
import { tabPanelize } from '../../../common/utility';

import loading from '../../../common/components/loading';
import Ztable from "../../../common/components/ztable/ztable";

import { ApolloClient, ApolloProvider, gql, InMemoryCache, useQuery } from "@apollo/client";

/**
 * This file and function queries for versions tab data and returns the rendered display
 * @returns versions tab
 */
const TabDataScreen = () => {
  const client = useMemo(
    () =>
      new ApolloClient({
        uri: "https://ga.staging.wenglab.org/graphql",
        cache: new InMemoryCache(),
      }),
    []
  );

  const { loading, error, data } = useQuery(
    gql`
      query {
        groundLevelVersionsQuery {
          version
          biosamples {
            biosample
            assays {
              assay
              experiments
            }
          }
        }
      }
    `,
    { client }
  );

  return ( 
    loading ? LoadingMessage() : 
    error ? ErrorMessage(error) : (
      <div>
        <VersionView data={data} />
      </div>
    )
  );
}

/**
 * links experiment accessions to their encode url and renders the columns
 * @returns columns for Ztable
 */
const CtsTableColumns = () => {
  const dccLink = (assay, accs) => {
    const url = (acc) => "https://www.encodeproject.org/experiments/" + acc;
    return (
      <p key={assay}>
        <strong>{assay}</strong>:&nbsp;
        {accs.map((acc, i) => (
          <span key={acc}>
            <a href={url(acc)} target="_blank" rel="noopener noreferrer">
              {acc}
            </a>
            {i < accs.length - 1 && ", "}
          </span>
        ))}
      </p>
    );
  };

  const renderBiosample = (biosample) =>
    biosample
      .substring(
        0,
        biosample[biosample.length - 1] === "'" ? biosample.length - 1 : biosample.length
      )
      .replace(/b'/g, "")
      .replace(/b"/g, "");

  const dccLinks = (experiments) =>
    Object.keys(experiments).map((assay) => dccLink(assay, experiments[assay]));

  const tmp = (assays) => {
    let table = {}
    for (let x of assays){
      table[x.assay] = dccLink(x.assay, x.experiments)
    }
    return table;
  }

  return [
    {
      title: "Biosample",
      data: "biosample_term_name",
      render: renderBiosample,
    },
    {
      title: "Experiments",
      data: "experiments",
      // render: tmp,
      render: dccLinks,
    },
  ];
};

/**
 * Logs and returns loading message
 * @returns active loader
 */
const LoadingMessage = () => {
  console.log("Loading...");
  return loading({isFetching: true, isError: false})
};

/**
 * Logs and returns error message
 * @param {ApolloError} error
 * @returns error message
 */
const ErrorMessage = (error) => {
  console.log("Error!");
  console.log(error.message);
  return (
    <Message negative>
      <Message.Header>Error!</Message.Header>
      <p>There was an error loading this page, try reloading.</p>
    </Message>
  );
};

/**
 * Organize and render data from query
 * @param {any} data groundLevelVersionsQuery
 * @returns rendered display of versions tab
 */
class VersionView extends React.Component {
  constructor (props) {
    super(props);
    this.totals = {}; // total experiments for each version { version: number of experiments }
    this.versions = {}; // dict of versions { version: [ { biosample: { assay: [ experiments ] } ] }
    this.versionIDs = []; // IDs of each version

    for (let x of this.props.data.groundLevelVersionsQuery) {
      this.versions[x.version] = [];
      this.totals[x.version] = 0;
      this.versionIDs.push(x.version);
      for (let b of x.biosamples) {
        let assays = {};
        for (let a of b.assays) {
          assays[a.assay] = a.experiments;
          this.totals[x.version] += a.experiments.length;
        }
        // Ztable uses a list of objects for each version
        this.versions[x.version].push({
          biosample_term_name: b.biosample,
          experiments: assays,
          // experiments: b.assays,
        });
      }
    }
  }

  render(){
    return (
      <div>
        <Tabs defaultActiveKey={1} id="tabset">
          {this.versionIDs.map((id, i) => (
            <Tab title={id} key={id} eventKey={i}>
              <h3>
                ENCODE and Roadmap Experiments constituting ground level version {id} ({this.totals[id].toLocaleString()} total)
              </h3>
              <Ztable 
                data={this.versions[id]} 
                cols={CtsTableColumns()} 
              />            
            </Tab>
          ))}
        </Tabs>
      </div>
    );
  }
};

class TabVersions extends React.Component {
  key = "versions";

  shouldComponentUpdate(nextProps, nextState) {
      return this.key === nextProps.maintabs_active;
  }

  render() {
    if(this.key !== this.props.maintabs_active)
      return false;
    return (
      tabPanelize(
        <div>
          <TabDataScreen />
        </div>
      )
    );
  }
}

export default TabVersions;
