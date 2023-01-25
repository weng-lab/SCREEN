/*
 * SPDX-License-Identifier: MIT
 * Copyright (c) 2016-2020 Michael Purcaro, Henry Pratt, Jill Moore, Zhiping Weng
 */

import React, { useMemo } from "react";

import { Loader } from 'semantic-ui-react';
import { Tabs, Tab } from "react-bootstrap";

import Ztable from "../../../common/components/ztable/ztable";

import { ApolloClient, gql, InMemoryCache, useQuery } from '@apollo/client';

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
        biosample[biosample.length - 1] === "'"
          ? biosample.length - 1
          : biosample.length
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

const query = gql`
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
`;

function TabDataScreen() {
  const client = useMemo( () => new ApolloClient({ uri: "https://ga.staging.wenglab.org/graphql", cache: new InMemoryCache() }), [] );
  const { loading, error, data } = useQuery(query, { client });

  if (loading) {
    console.log("Loading...");
    return <Loader active>Loading...</Loader>;
  }

  if (error) {
    console.log("Error!");
    console.log(`${error.message}`);
    return <div>error.message</div>;
  }

  let totals = {};    // total experiments for each version { version: number of experiments }
  let versions = {};  // dict of versions { version: biosample: assay: [ experiments ] }
  let versionIDs = [] // IDs of each version

  for (let x of data.groundLevelVersionsQuery) {
    for (let b of x.biosamples) {
      let assays = {};          // assays
      for (let a of b.assays) {
        assays[a.assay] = a.experiments;  // experiments
        if (totals[x.version] === undefined) totals[x.version] = a.experiments.length;
        else totals[x.version] += a.experiments.length;
      }
      let biosamples = {
        biosample_term_name: b.biosample,
        experiments: assays
      }
      if (versions[x.version] === undefined) versions[x.version] = [biosamples];
      else versions[x.version].push(biosamples);
    }
    versionIDs.push(x.version)
  }

  return (
    <div>
      <Tabs defaultActiveKey={1} id="tabset">
        {versionIDs.map((id, i) => (
          <Tab title={id} key={id} eventKey={i}>
            <h3>
              ENCODE and Roadmap Experiments constituting ground level
              version {id} ({totals[id].toLocaleString()} total)
            </h3>
            <Ztable 
              data={versions[id]} 
              cols={CtsTableColumns()} 
            />
          </Tab>
        ))}
      </Tabs>
    </div>
  );
};

export default TabDataScreen;
