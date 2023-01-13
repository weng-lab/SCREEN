/*
 * SPDX-License-Identifier: MIT
 * Copyright (c) 2016-2020 Michael Purcaro, Henry Pratt, Jill Moore, Zhiping Weng
 */

import React from "react";

import { Tabs, Tab } from "react-bootstrap";

import Ztable from "../../../common/components/ztable/ztable";
import loading from "../../../common/components/loading";

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
    bigRequests(requests: [{ url: "gs://gcp.wenglab.org/SCREEN/ground_level_versions" }]) {
      data
    }
  }
`;

class TabDataScreen extends React.Component {
  constructor(props) {
    super(props);
    this.state = { isFetching: false, isError: false };
  }

  componentDidMount() {
    this.loadFiles(this.props);
  }

  UNSAFE_componentWillReceiveProps(nextProps) {
    this.loadFiles(nextProps);
  }

  loadFiles(nextProps) {
    const client = useMemo( () => new ApolloClient({ uri: "https://ga.staging.wenglab.org/graphql", cache: new InMemoryCache() }), [] );
    const { loading, error, data } = useQuery(query, { client });
    
    if ("files" in this.state) return;
    if (this.state.isFetching) return;
    if (loading) {
      console.log("Loading...");
      return;
    }

    this.setState({ isFetching: true });

    if (error) {
      console.log("Error!");
      console.log(`${error.message}`);
      this.setState({ isFetching: false, isError: true });
    }
    else {
      let totals = {};    // total experiments for each version { version: number of experiments }
      let versions = {};  // dict of versions { version: biosample: assay: [ experiments ] }
      for (let x of data) {
        let biosamples = {};    // biosamples
        for (let b of x.biosamples) {
          let assays = {};          // assays
          for (let a of b.assays) {
            assays[a] = a.experiments;  // experiments
            if (totals[x.version] === undefined) totals[x.version] = a.experiments.length;
            else totals[x.version] += a.experiments.length;
          }
          biosamples[b] = assays;
        }
        versions[x.version] = biosamples;
      }

      let versionIDs = Object.keys(versions);

      this.setState({
        versions,
        selectedVersion: 0,
        versionIDs,
        totals,
        isFetching: false,
        isError: false,
      });
    }
  }

  render() {
    if (this.state.versions && this.state.versionIDs)
      return (
        <div>
          <Tabs defaultActiveKey={1} id="tabset">
            {this.state.versionIDs.map((id, i) => (
              <Tab title={id} key={id} eventKey={i}>
                <h3>
                  ENCODE and Roadmap Experiments constituting ground level
                  version {id} ({this.state.totals[id].toLocaleString()} total)
                </h3>
                <Ztable
                  data={this.state.versions[id]}
                  cols={CtsTableColumns()}
                />
              </Tab>
            ))}
          </Tabs>
        </div>
      );
    return loading({ ...this.state });
  }
}

export default TabDataScreen;
