/*
 * SPDX-License-Identifier: MIT
 * Copyright (c) 2016-2020 Michael Purcaro, Henry Pratt, Jill Moore, Zhiping Weng
 */

import React from "react";
import * as ApiClient from "../api_client";

import * as Render from "../zrenders";
import Ztable from "./ztable/ztable";

class IntersectingAssay extends React.Component {
  constructor(props, url, table) {
    super(props);
    this.url = url;
    this.table = table;
    this.state = { target: null, isFetching: true, isError: false, jq: null };
    this.loadTarget = this.loadTarget.bind(this);
  }

  UNSAFE_componentWillReceiveProps(nextProps) {
    this.loadTarget(nextProps, this.state.target);
  }

  loadTarget({ assembly, cre_accession_detail, table }, target) {
    if (!target) {
      return;
    }
    if (target in this.state) {
      this.setState({ target });
      return;
    }
    let q = {
      assembly,
      accession: cre_accession_detail,
      target,
      eset: table.eset,
    };
    var jq = JSON.stringify(q);
    if (this.state.jq === jq) {
      return;
    }
    this.setState({ jq, isFetching: true });
    ApiClient.getByPost(
      jq,
      this.url,
      (r) => {
        this.setState({ target, ...r, jq, isFetching: false, isError: false });
      },
      (msg) => {
        console.log("err loading target for table");
        this.setState({
          target: null,
          jq: null,
          isFetching: false,
          isError: true,
        });
      }
    );
  }

  render() {
    let data = this.props.data;
    let table = this.props.table;
    let onTdClick = (i, d) => {
      this.loadTarget(this.props, d.name);
    };

    let details = "";
    let target = this.state.target;

    const _renders = {
      peak: Render.dccLinkAndIconSplit,
      cistrome: Render.cistromeLink,
    };

    if (target && target in this.state) {
      let table = {
        title: "ChIP-seq " + target + " Experiments",
        cols: [
          { title: "cell type", data: "biosample_term_name" },
          {
            title: "experiment / file",
            data: "expID",
            render:
              _renders[this.props.table.eset ? this.props.table.eset : "peak"],
          },
        ],
        order: [[0, "asc"]],
      };
      details = (
        <div id={this.table}>
          <br />
          <h4>{table.title}</h4>
          {React.createElement(Ztable, { data: this.state[target], ...table })}
        </div>
      );
    }

    return (
      <div className={"intersectionTable"}>
        {React.createElement(Ztable, {
          data,
          ...table,
          onTdClick,
          onMouseEnter: true,
          onMouseExit: true,
        })}
        {details}
      </div>
    );
  }
}

export default IntersectingAssay;
