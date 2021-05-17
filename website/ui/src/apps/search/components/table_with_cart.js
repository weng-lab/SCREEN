/*
 * SPDX-License-Identifier: MIT
 * Copyright (c) 2016-2020 Michael Purcaro, Henry Pratt, Jill Moore, Zhiping Weng
 */

import React from "react";
import downloadjs from "downloadjs";

import Ztable from "../../../common/components/ztable/ztable";
import Legend from "./legend";
import * as ApiClient from "../../../common/api_client";

import TableColumns, { table_order } from "../config/table_with_cart";
import { numberWithCommas } from "../../../common/common";
import loading from "../../../common/components/loading";

import { doToggle, isCart } from "../../../common/utility";
import GenomeBrowser from "../../../common/components/genomebrowser/components/genomebrowser";
import { List, Segment } from "semantic-ui-react";

class TableWithCart extends React.Component {
  state = {
    minrange: 0,
    maxrange: 0,
    selectedaccession: {},
    chrom: "",
    cellType: "",
  };

  _get_missing(a) {
    const assays = {
      dnase: "DNase-seq",
      promoter: "H3K4me3 ChIP-seq",
      enhancer: "H3K27ac ChIP-seq",
      ctcf: "CTCF ChIP-seq",
    };
    let r = [];
    Object.keys(assays).forEach((k) => {
      if (!a.includes(k)) {
        r.push(assays[k]);
      }
    });
    return r;
  }

  table_click_handler = (td, rowdata, actions) => {
    if (td.indexOf("browser") !== -1) {
      let cre = { ...rowdata, ...rowdata.info };
      actions.showGenomeBrowser(cre, "");
      return;
    }
    if (td.indexOf("experimental") !== -1) {
      return;
    }
    if (td.indexOf("geneexp") !== -1) {
      return;
    }
    if (td.indexOf("cart") !== -1) {
      const accession = rowdata.info.accession;
      const accessions = doToggle(this.props.cart_accessions, accession);
      const j = {
        assembly: this.props.assembly,
        accessions: Array.from(accessions),
        uuid: this.props.uuid,
      };
      ApiClient.setByPost(
        JSON.stringify(j),
        "/cart/set",
        (r) => { },
        (msg) => {
          console.log("error posting to cart/set", msg);
        }
      );
      actions.setCart(accessions);
      return;
    }
    if (td.indexOf("selectcre") !== -1) {
      let minrange = +rowdata.start - +2000;
      let maxrange = +rowdata.start + +rowdata.len + +2000;
      let accessiondetails = {
        accession: rowdata.info.accession,
        start: rowdata.start,
        len: rowdata.len,
        chrom: rowdata.chrom,
      };
      this.setState(
        {
          minrange: minrange,
          maxrange: maxrange,
          selectedaccession: accessiondetails,
          chrom: rowdata.chrom,
          cellType: this.props.cellType,
        },
        () => {
          actions.selectcre(accessiondetails);
        }
      );
    } else {
      let cre = { ...rowdata, ...rowdata.info };
      actions.showReDetail(cre);
    }
  };

  addAllToCart() {
    let accessions = this.props.data.map((d) => {
      return d.info.accession;
    });
    accessions = new Set([...this.props.cart_accessions, ...accessions]);
    const j = {
      assembly: this.props.assembly,
      accessions: Array.from(accessions),
      uuid: this.props.uuid,
    };
    ApiClient.setByPost(
      JSON.stringify(j),
      "/cart/set",
      (response) => {
        let href = window.location.href;
        if (!href.includes("&cart")) {
          href += "&cart";
        }
        window.location.assign(href);
      },
      (msg) => {
        console.log("error posting to cart/set", msg);
      }
    );
    this.props.actions.setCart(accessions);
  }

  clearCart() {
    const accessions = new Set([]);
    const j = {
      assembly: this.props.assembly,
      accessions: Array.from(accessions),
      uuid: this.props.uuid,
    };
    ApiClient.setByPost(
      JSON.stringify(j),
      "/cart/set",
      (response) => {
        let href = window.location.href;
        if (href.includes("&cart")) {
          // go back to search page
          href = href.replace("&cart", "");
        }
        window.location.assign(href);
      },
      (msg) => {
        console.log("error posting to cart/set", msg);
      }
    );
    this.props.actions.setCart(accessions);
  }

  downloadBed() {
    const jq = this.props.jq;
    ApiClient.getByPost(
      jq,
      "/dataws/bed_download",
      (got) => {
        if ("error" in got) {
          console.log(got["error"]);
          //$("#errMsg").text(got["err"]);
          //$("#errBox").show()
          return true;
        }
        const urlBase = got["url"];
        const url = ApiClient.Servers(urlBase);
        return downloadjs(url);
      },
      (msg) => {
        console.log("error getting bed download", msg);
      }
    );
  }

  downloadJSON() {
    const jq = this.props.jq;
    ApiClient.getByPost(
      jq,
      "/dataws/json_download",
      (got) => {
        if ("error" in got) {
          console.log(got["error"]);
          //$("#errMsg").text(got["err"]);
          //$("#errBox").show()
          return true;
        }
        const urlBase = got["url"];
        const url = ApiClient.Servers(urlBase);
        return downloadjs(url);
      },
      (msg) => {
        console.log("error getting bed download", msg);
      }
    );
  }

  totalText(data) {
    if (data.length < this.props.total) {
      return (
        "displaying top " +
        numberWithCommas(data.length) +
        " results of " +
        numberWithCommas(this.props.total) +
        " total"
      );
    }
    return "found " + this.props.total + " results";
  }

  tableFooter(data) {
    const total = this.totalText(data);
    var addTitle = "Add all to cart";
    if (this.props.data.length >= 1000) {
      addTitle = "Add 1,000 to cart";
    }
    return (
      <div style={{ display: this.props.isFetching ? "none" : "block" }}>
        <span className="tableInfo">
          <div className={"btn-group"} role={"group"}>
            <button
              type={"button"}
              className={"btn btn-default btn-xs"}
              onClick={() => {
                this.addAllToCart();
              }}
            >
              {addTitle}
            </button>
            <button
              type={"button"}
              className={"btn btn-default btn-xs"}
              onClick={() => {
                this.clearCart();
              }}
            >
              {"Clear cart"}
            </button>
            <button
              type={"button"}
              className={"btn btn-default btn-xs"}
              onClick={() => {
                this.downloadBed();
              }}
            >
              Download bed
            </button>
            <button
              type={"button"}
              className={"btn btn-default btn-xs"}
              onClick={() => {
                this.downloadJSON();
              }}
            >
              Download JSON
            </button>
          </div>
          &nbsp;&nbsp;{total}
        </span>
      </div>
    );
  }

  _format_message(a) {
    if (a.length === 0) {
      return a;
    }
    let r = "";
    for (let i = 0; i < a.length - 1; ++i) {
      r += a[i] + ", ";
    }
    r += "or " + a[a.length - 1];
    return r;
  }

  _oppositeAssays(a) {
    let r = { dnase: true, promoter: true, enhancer: true, ctcf: true };
    let map = {
      "DNase-seq": "dnase",
      "H3K4me3 ChIP-seq": "promoter",
      "H3K27ac ChIP-seq": "enhancer",
      "CTCF ChIP-seq": "ctcf",
    };
    if (!a) {
      return r;
    }
    for (let i in a) {
      r[map[a[i]]] = false;
    }
    return r;
  }

  _opposite(a, cts) {
    let r = this._oppositeAssays(a);
    r["cts"] = false;
    r["sctv"] = false;
    if (cts) {
      for (let e of cts) {
        r[e] = true;
      }
    }
    return r;
  }

  table(data, actions) {
    const missingAssays = this._get_missing(this.props.rfacets);

    let tooMany = "";
    if (data.length < this.props.total) {
      tooMany = (
        <List.Item>
          <em>
            For performance, SCREEN cannot display more than 1,000 candidate
            cis-Regulatory Elements (cCREs) in this table. You may download the
            entire set of search results in bed or JSON format, or use the
            facets at left to narrow your search.
          </em>
        </List.Item>
      );
    }
    let failMsg = "";
    if (missingAssays && missingAssays.length) {
      failMsg = (
        <List.Item>
          <em>
            The cell type you have selected does not have{" "}
            {this._format_message(missingAssays)} data available.
          </em>
        </List.Item>
      );
    }

    let meetMsg = "";
    let jq = JSON.parse(this.props.jq);
    if (!isCart() && jq && jq.coord_chrom) {
      meetMsg = (
        <List.Item>
          <h4>
            Showing {data.length > 1000 ? 1000 : data.length} matching Candidate
            cis-Regulatory Elements (cCREs) in the region {jq.coord_chrom}:
            {jq.coord_start}-{jq.coord_end}.
          </h4>
        </List.Item>
      );
    }
    let click =
      "Click a cCRE accession to view details about the cCRE, including top tissues, nearby genomic features, etc.";

    let geneView =
      "Click a gene ID to view the expression profile of the gene.";
    let diffExp = "";
    if ("mm10" === this.props.assembly) {
      diffExp = (
        <span>
          {"Click the "}
          <span>&Delta;</span>
          {
            " following a gene ID to explore the differential expression of the gene between two cell types."
          }
        </span>
      );
    }

    let ctCol = null;
    if (this.props.cellType) {
      ctCol = this.props.make_ct_friendly(this.props.cellType);
    }

    let bigWigByCellType =
      this.props.globals["byCellType"][this.props.cellType];
    let bigBedByCellType =
      this.props.globals["creBigBedsByCellType"][this.props.cellType];
    let gb = null;
    if (
      Object.keys(this.props.gb_cres).length !== 0 &&
      this.props.chrom === this.state.chrom &&
      this.state.cellType === this.props.cellType
    ) {
      gb = (
        <GenomeBrowser
          minrange={this.state.minrange}
          chrom={this.state.chrom}
          maxrange={this.state.maxrange}
          cellType={this.props.cellType}
          bigBedByCellType={bigBedByCellType}
          byCellType={bigWigByCellType}
          assembly={this.props.assembly}
          selectedaccession={this.state.selectedaccession}
        />
      );
    }

    return (
      <div
        ref={"searchTable"}
        style={{ display: this.props.isFetching ? "none" : "block" }}
      >
        <Segment style={{ backgroundColor: "rgb(255, 165, 136)" }}>
          <List>
            {tooMany}
            {failMsg}
            {meetMsg}
          </List>
          <List bulleted>
            <List.Item>{click}</List.Item>
            <List.Item>{geneView}</List.Item>
            {diffExp && <List.Item>{diffExp}</List.Item>}
          </List>
        </Segment>

        {gb}

        <Ztable
          data={data}
          sortCol={table_order}
          cols={TableColumns(this.props, ctCol)}
          onTdClick={(td, rowdata) =>
            this.table_click_handler(td, rowdata, actions)
          }
          bFilter={true}
          bLengthChange={true}
          key={this.props.cellType}
          noTotal={true}
        />
      </div>
    );
  }

  render() {
    var data = [...this.props.data];
    var actions = this.props.actions;

    let cas = this.props.cart_accessions;
    for (var i in data) {
      data[i].in_cart = cas.has(data[i].info.accession);
    }

    return (
      <div style={{ width: "100%" }} className={"mainSearchTable"}>
        {loading(this.props)}
        {this.table(data, actions)}
        {this.tableFooter(data)}

        <div style={{ display: this.props.isFetching ? "none" : "block" }}>
          <div className="row">
            <div className="col-md-12">
              <Legend {...this.props} />
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default TableWithCart;
