/*
 * SPDX-License-Identifier: MIT
 * Copyright (c) 2016-2020 Michael Purcaro, Henry Pratt, Jill Moore, Zhiping Weng
 */

import React from "react";
import { connect } from "react-redux";
import { bindActionCreators } from "redux";

import $ from "jquery";

import * as ApiClient from "../../../common/api_client";
import * as Actions from "../actions/main_actions";
import * as Render from "../../../common/zrenders";
import Ztable from "../../../common/components/ztable/ztable";

import DraggableCtList from "../../../common/components/draggable";

class ConfigureGenomeBrowser extends React.Component {
  state = { showCombo: true };

  gbclick = (cre, cts, gbrowser) => {
    const half_window = 7500;
    let host = ApiClient.ApiServer;
    if (host.startsWith("/")) {
      const arr = window.location.href.split("/");
      host = arr[0] + "//" + arr[2] + host;
    }
    const data = {
      accession: cre.accession ? cre.accession : cre.title,
      coord_chrom: cre.chrom,
      coord_start: cre.start,
      coord_end: cre.start + cre.len,
      halfWindow: half_window,
      version: 2,
      cellTypes: cts,
      showCombo: this.state.showCombo,
      uuid: this.props.uuid,
      host,
      assembly: this.props.assembly,
    };
    let jdata = JSON.stringify(data);
    switch (gbrowser) {
      case "UCSC":
        this.openGenomeBrowser(jdata, "/ucsc_trackhub_url");
        break;
      case "WashU":
        this.openGenomeBrowser(jdata, "/washu_trackhub_url");
        break;
      case "Ensembl":
        this.openGenomeBrowser(jdata, "/ensembl_trackhub_url");
        break;
      default:
        console.log("unknown genome browser " + gbrowser);
    }
  };

  openGenomeBrowser = (data, url) => {
    $.ajax({
      type: "POST",
      url: ApiClient.Servers(url),
      data: data,
      dataType: "json",
      contentType: "application/json",
      async: false, // http://stackoverflow.com/a/20235765
      success: (r) => {
        if ("err" in r) {
          $("#errMsg").text(r.err);
          $("#errBox").show();
          return true;
        }
        console.log(r.url, r.trackhubUrl);
        window.open(r.url, "_blank");
      },
      error: (a, b, c) => {
        console.log(a);
      },
    });
  };

  optionsChanged = (s) => {
    this.setState({ showCombo: s });
  };

  render() {
    let cre = this.props.configuregb_cre;
    let cols = [
      { title: "", data: "checked", render: Render.checkCt },
      { title: "cell type", data: "name" },
      { title: "tissue", data: "tissue" },
      {
        title: "",
        data: "cellTypeName",
        className: "dcc",
        render: Render.assayIcon(this.props.globals),
        orderable: false,
      },
      { title: "RNA-seq", data: "rnaseq", render: Render.rnaseq },
      { title: "synonyms", data: "synonyms", visible: false },
    ];

    let ctBox = (
      <Ztable
        cols={cols}
        data={this.props.configuregb_cts}
        order={[]}
        buttonsOff={true}
        onTdClick={(td, cellObj) => {
          this.props.actions.toggleGenomeBrowserCelltype(cellObj.value);
        }}
        bFilter={true}
        bLengthChange={false}
        pageLength={10}
      />
    );

    let rows = [];
    let cts = this.props.configuregb_cts;
    for (let ct of cts) {
      if (!ct.checked || !ct.name) continue;
      rows.push({
        ...ct,
        onClick: () => {
          this.props.actions.toggleGenomeBrowserCelltype(ct.cellTypeName);
        },
      });
    }
    let selectedBiosamples = (
      <div className="panel panel-default">
        <div className="panel-heading">
          <h3 className="panel-title">Selected biosamples</h3>
          <small>
            Use the handles at left to drag items and change the order in which
            they will display in the browser.
          </small>
          <br />
          <small>
            Note: For best UCSC performance, choose &lt;10 cell types.
          </small>
        </div>
        <div className="panel-body" ref="lcontainer">
          <DraggableCtList
            items={rows}
            container={this.refs.lcontainer}
            onMoveEnd={(newlist, moveditem, oldindex, newindex) => {
              this.props.actions.setGenomeBrowserCelltypes(newlist);
            }}
          />
        </div>
      </div>
    );

    let availBiosamples = (
      <div className="panel panel-default">
        <div className="panel-heading">
          <h3 className="panel-title">Available biosamples</h3>
        </div>
        <div className="panel-body">{ctBox}</div>
      </div>
    );

    return (
      <div className="container" style={{ width: "100%" }}>
        <div className="row">
          <div className="col-md-12">
            {this.props.configuregb_type === "cre"
              ? Render.creTitle(this.props.globals, cre)
              : Render.titlegeneric(cre)}
          </div>
        </div>

        <br />

        <div className="row">
          <div className="col-md-2">
            <div className="btn-group" role="group">
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => {
                  this.gbclick(
                    cre,
                    cts.filter((x) => x.checked).map((x) => x.cellTypeName),
                    "UCSC"
                  );
                }}
              >
                {"Open in UCSC"}
              </button>
            </div>
          </div>
        </div>

        <br />

        <div className="row">
          <div className="col-md-6"></div>
          <div className="col-md-6"></div>
        </div>

        <div className="row">
          <div className="col-md-6">
            {selectedBiosamples}
            {availBiosamples}
          </div>

          <div className="col-md-6"></div>
        </div>
      </div>
    );
  }
}

const mapStateToProps = (state) => ({ ...state });
const mapDispatchToProps = (dispatch) => ({
  actions: bindActionCreators(Actions, dispatch),
});
export default connect(
  mapStateToProps,
  mapDispatchToProps
)(ConfigureGenomeBrowser);
