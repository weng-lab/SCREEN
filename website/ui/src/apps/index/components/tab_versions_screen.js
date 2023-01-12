/*
 * SPDX-License-Identifier: MIT
 * Copyright (c) 2016-2020 Michael Purcaro, Henry Pratt, Jill Moore, Zhiping Weng
 */

import React from "react";

import { Tabs, Tab } from "react-bootstrap";

import Ztable from "../../../common/components/ztable/ztable";
import loading from "../../../common/components/loading";
import * as ApiClient from "../../../common/api_client";

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
    if ("files" in this.state) {
      return;
    }
    if (this.state.isFetching) {
      return;
    }
    this.setState({ isFetching: true });
    // const jq = JSON.stringify({ assembly: "GRCh38" });
    ApiClient.getByPost(
      "/dataws/ground_level_versions",
      (r) => {
        let totals = {};
        let versions = {};

        for (let x of r) {
          let biosamples = {};
          for (let b of x.biosamples) {
            let assays = {};
            for (let a of b.assays) {
              assays[a] = a.experiments;
              if (totals[x.version] === undefined)
                totals[x.version] = a.experiments.length;
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
      },
      (err) => {
        console.log("err loading files");
        console.log(err);
        this.setState({ isFetching: false, isError: true });
      }
    );
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
