/*
 * SPDX-License-Identifier: MIT
 * Copyright (c) 2016-2020 Michael Purcaro, Henry Pratt, Jill Moore, Zhiping Weng
 */

import React, { useMemo } from "react";

import { Loader, Message } from "semantic-ui-react";
import { Tabs, Tab } from "react-bootstrap";

import Ztable from "../../../common/components/ztable/ztable";

import { ApolloClient, ApolloError, gql, InMemoryCache, useQuery } from "@apollo/client";

/**
 * This file and function queries for versions tab data and returns the rendered display
 * @returns versions tab
 */
export default function TabDataScreen() {
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

  if (loading) LoadingMessage();
  if (error) ErrorMessage(error);

  return VersionView(data.groundLevelVersionsQuery);
}

/**
 * Organize and render data from query
 * @param {dictionary} data groundLevelVersionsQuery
 * @returns display of versions tab
 */
const VersionView = (data) => {
  let totals = {}; // total experiments for each version { version: number of experiments }
  let versions = {}; // dict of versions { version: [ { biosample: { assay: [ experiments ] } ] }
  let versionIDs = []; // IDs of each version

  for (let x of data) {
    versions[x.version] = [];
    totals[x.version] = 0;
    versionIDs.push(x.version);
    for (let b of x.biosamples) {
      let assays = {};
      for (let a of b.assays) {
        assays[a.assay] = a.experiments;
        totals[x.version] += a.experiments.length;
      }
      // Ztable uses a list of objects for each version
      versions[x.version].push({
        biosample_term_name: b.biosample,
        experiments: assays,
      });
    }
  }

  return (
    <div>
      <Tabs defaultActiveKey={1} id="tabset">
        {versionIDs.map((id, i) => (
          <Tab title={id} key={id} eventKey={i}>
            <h3>
              ENCODE and Roadmap Experiments constituting ground level version
              {id} ({totals[id].toLocaleString()} total)
            </h3>
            <Ztable data={versions[id]} cols={CtsTableColumns()} />
          </Tab>
        ))}
      </Tabs>
    </div>
  );
};

/**
 * links experiment accessions to their encode url and renders the columns
 * @returns rendered columns for the Ztable
 */
const CtsTableColumns = () => {
  const dccLink = (assay, accs) => {
    const url = (acc) => "https://www.encodeproject.org/experiments/" + acc;
    return (
      <p>
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

  return [
    {
      title: "Biosample",
      data: "biosample_term_name",
      render: renderBiosample,
    },
    {
      title: "Experiments",
      data: "experiments",
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
  return <Loader active>Loading...</Loader>;
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
