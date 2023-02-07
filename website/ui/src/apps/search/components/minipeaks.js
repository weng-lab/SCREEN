/*
 * SPDX-License-Identifier: MIT
 * Copyright (c) 2016-2020 Michael Purcaro, Henry Pratt, Jill Moore, Zhiping Weng
 */

import React from "react"
import { connect } from "react-redux"
import { bindActionCreators } from "redux"

import * as ApiClient from "../../../common/api_client"
import * as Actions from "../actions/main_actions"
import * as Render from "../../../common/zrenders"

import Ztable from "../../../common/components/ztable/ztable"
import loading from "../../../common/components/loading"

const ROWHEIGHT = 30.0

class MiniPeaks extends React.Component {
  state = { jq: null, isFetching: true, isError: false }
  key = "miniPeaks"
  _colors = {
    dnase: "#06DA93",
    h3k4me3: "#FF0000",
    h3k27ac: "#FFCD00",
  }
  fileIDmaxes = {}

  shouldComponentUpdate(nextProps, nextState) {
    if ("details" === nextProps.maintabs_active) {
      if (this.key === nextProps.re_details_tab_active) {
        return true
      }
    }
    return false
  }

  UNSAFE_componentWillReceiveProps(nextProps) {
    // only check/get data if we will become active tab...
    if ("details" === nextProps.maintabs_active) {
      if (this.key === nextProps.re_details_tab_active) {
        this.loadPeaks(nextProps)
      }
    }
  }

  updateFileMaxes = (D) => {
    for (const acc of D.accessions) {
      for (const rData of D.rows) {
        for (let assay of ["dnase", "h3k27ac", "h3k4me3"]) {
          const dr = rData[acc + assay]
          if (!dr) {
            continue
          }
          const fileID = dr.fileID
          this.fileIDmaxes[fileID] = Math.max(...dr.data)
        }
      }
    }
  }

  loadPeaks({ assembly, cre_accession_detail }) {
    const accession = cre_accession_detail
    if (accession in this.state) {
      return
    }
    const q = { assembly, accession }
    const jq = JSON.stringify(q)
    if (this.state.jq === jq) {
      // http://www.mattzeunert.com/2016/01/28/javascript-deep-equal.html
      return
    }
    this.setState({ jq, isFetching: true })
    ApiClient.getMinipeaks(
      jq,
      this.key,
      (r) => {
        this.updateFileMaxes(r[accession])
        this.setState({ ...r, jq, isFetching: false, isError: false })
      },
      (msg) => {
        console.log("err loading minipeaks")
        console.log(msg)
        this.setState({ jq: null, isFetching: false, isError: true })
      }
    )
  }

  renderPeaks = (dr) => {
    if (!dr) {
      return ""
    }
    // let fileID = dataRaw.fileID; if needed....
    const mmax = dr.assay === "dnase" ? 10 : 50
    const mfactor = ROWHEIGHT / mmax
    const data = dr.data.map((d) => (d > mmax ? mmax : d) * mfactor)
    const color = this._colors[dr.assay]

    const fileID = dr.fileID
    const dataMax = this.fileIDmaxes[fileID]

    return (
      <span className={"text-nowrap"}>
        <svg width={data.length} height={ROWHEIGHT}>
          <g>
            {data.map((v, i) => (
              <rect width="1" height={v} key={i} y={ROWHEIGHT - v} x={i} fill={color} />
            ))}
          </g>
        </svg>{" "}
        {dataMax.toFixed(1)}
      </span>
    )
  }

  sortByMax = (d) => {
    if (!d) {
      return 0
    }
    return this.fileIDmaxes[d.fileID]
  }

  doRender(accession) {
    let cols = []
    let assayToTitle = { dnase: "DNase", h3k27ac: "H3K27ac", h3k4me3: "H3K4me3" }
    for (let acc of this.state[accession].accessions) {
      for (let assay of ["dnase", "h3k27ac", "h3k4me3"]) {
        cols.push({
          title: assayToTitle[assay],
          data: acc + assay,
          className: "minipeak",
          sortDataF: this.sortByMax,
          render: this.renderPeaks,
        })
      }
    }
    cols = cols.concat([
      { title: "", data: "expIDs", render: Render.dccLinkCtGroupExpIDs },
      { title: "Tissue of origin", data: "tissue" },
      { title: "Cell Type", data: "biosample_type" },
      { title: "Biosample", data: "biosample_summary" },
    ])

    const table = { title: "Minipeaks", cols, bFilter: true, sortCol: [accession + "dnase", false] }
    return React.createElement(Ztable, { data: this.state[accession].rows, ...table })
  }

  render() {
    let accession = this.props.cre_accession_detail
    if (!(accession in this.state)) {
      return loading(this.state)
    }

    return <div className={"minipeaks"}>{this.doRender(accession)}</div>
  }
}

const mapStateToProps = (state) => ({ ...state })
const mapDispatchToProps = (dispatch) => ({
  actions: bindActionCreators(Actions, dispatch),
})
export default connect(mapStateToProps, mapDispatchToProps)(MiniPeaks)
