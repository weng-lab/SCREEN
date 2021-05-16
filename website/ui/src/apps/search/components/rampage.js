/*
 * SPDX-License-Identifier: MIT
 * Copyright (c) 2016-2020 Michael Purcaro, Henry Pratt, Jill Moore, Zhiping Weng
 */

import React from "react";

import { connect } from "react-redux";
import { bindActionCreators } from "redux";

import ScaledHorizontalBar from "../../../plots/components/scaledhorizontalbar";

import HelpIcon from "../../../common/components/help_icon";

import * as Render from "../../../common/zrenders";
import * as Actions from "../actions/main_actions";

class Rampage extends React.Component {
  constructor(props) {
    super(props);
    this.key = "rampage";
    this.state = {
      transcript: props.keysAndData.sortedTranscripts[0],
      sortOrder: "byValue",
      datascale: "counts",
    };
  }

  UNSAFE_componentWillMount() {
    document.addEventListener("keydown", this.handleKeyPress);
  }

  componentWillUnmount() {
    document.removeEventListener("keydown", this.handleKeyPress);
  }

  _bb = (transcript) => {
    return (
      <button
        type="button"
        className="btn btn-default btn-xs"
        onClick={() => {
          this.gclick("UCSC", transcript);
        }}
      >
        UCSC
      </button>
    );
  };

  gclick = (name, transcript) => {
    this.props.actions.showGenomeBrowser(
      {
        title: transcript.transcript,
        start: transcript.start,
        len: transcript.stop - transcript.start,
        chrom: transcript.chrom,
      },
      name,
      "rampagetranscript"
    );
  };

  transcriptUp = () => {
    const sortedTranscripts = this.props.keysAndData.sortedTranscripts;
    const curT = this.state.transcript;
    let idx = sortedTranscripts.indexOf(curT);
    idx -= 1;
    if (idx < 0) {
      idx = sortedTranscripts.length - 1;
    }
    this.setState({ transcript: sortedTranscripts[idx] });
  };

  transcriptDown = () => {
    const sortedTranscripts = this.props.keysAndData.sortedTranscripts;
    const curT = this.state.transcript;
    let idx = sortedTranscripts.indexOf(curT);
    idx += 1;
    if (idx >= sortedTranscripts.length) {
      idx = 0;
    }
    this.setState({ transcript: sortedTranscripts[idx] });
  };

  handleKeyPress = (event) => {
    if ("details" === this.props.maintabs_active) {
      if (this.key !== this.props.re_details_tab_active) {
        return;
      }
    }

    if (event.key === "n") {
      this.transcriptUp();
    } else if (event.key === "m") {
      this.transcriptDown();
    }
  };

  svgRender = () => {
    if (
      "details" === this.props.maintabs_active &&
      "rampage" !== this.props.re_details_tab_active
    ) {
      return;
    }

    const allData = this.props.keysAndData.tsss;
    const transcript = allData[this.state.transcript];

    const itemsByID = transcript.itemsByID;
    const items = transcript.itemsGrouped[this.state.sortOrder];

    const rank_f = (rid) => itemsByID[rid][this.state.datascale];

    const format = {
      value: rank_f,
      label: (rid) => {
        const d = itemsByID[rid];
        return (
          d.expid + " " + d.biosample_term_name + " (" + d.strand + ") strand"
        );
      },
      grouplabel: (d) => d.tissue,
    };

    return (
      <ScaledHorizontalBar
        itemsets={items}
        width={this.props.width}
        barheight={this.props.barheight}
        format={format}
      />
    );
  };

  render() {
    const sortedTranscripts = this.props.keysAndData.sortedTranscripts;
    const data = this.props.keysAndData.tsss;
    const gene = this.props.keysAndData.gene;

    const selectTsses = sortedTranscripts.map((tss) => (
      <option key={tss} value={tss}>
        {tss}
      </option>
    ));
    const numTranscripts = sortedTranscripts.length;

    const transcript = data[this.state.transcript];

    let distance = "";
    if ("distance" in gene) {
      distance =
        "   (" + Render.numWithCommas(gene.distance) + " bases from cCRE)";
    }

    const title = (
      <div className="container-fluid" style={{ width: "100%" }}>
        <div className="row">
          <div className="col-md-8">
            <span className={"rampageGeneName"}>
              <h4>
                TSS Activity Profiles by RAMPAGE
                <HelpIcon
                  globals={this.props.globals}
                  helpkey={"RAMPAGEOverview"}
                />
              </h4>
              <h2>
                <em>{gene.name}</em>
              </h2>
              {gene.ensemblid_ver}
              {distance}
            </span>
          </div>
        </div>
      </div>
    );

    let transcriptControls = (
      <div className="col-md-6">
        {"Transcript: "}
        <span>
          <select
            value={this.state.transcript}
            onChange={(s) => {
              this.setState({ transcript: s.target.value });
            }}
          >
            {selectTsses}
          </select>
          {numTranscripts > 1 && (
            <span
              className="glyphicon glyphicon-arrow-up"
              aria-hidden="true"
              onClick={this.transcriptUp}
            ></span>
          )}
          {numTranscripts > 1 && (
            <span
              className="glyphicon glyphicon-arrow-down"
              aria-hidden="true"
              onClick={this.transcriptDown}
            ></span>
          )}
          {this._bb(transcript)}
        </span>
        <div className="rampageCoord">
          {transcript["chrom"]}:{transcript["start"]}-{transcript["stop"]}
          {"  ("}
          {transcript["strand"]}
          {") "}
          {transcript["geneinfo"]}
        </div>
      </div>
    );

    let sortControls = (
      <div className="col-md-3">
        {"Choose sort order: "}
        <select
          value={this.state.sortOtder}
          onChange={(s) => {
            this.setState({ sortOrder: s.target.value });
          }}
        >
          <option value="byValue">by value</option>
          <option value="byTissue">by tissue</option>
          <option value="byTissueMax">by tissue max</option>
        </select>
      </div>
    );

    return (
      <div>
        {title}
        <br />
        <div className="container">
          <div className="row">
            {transcriptControls}
            {sortControls}
          </div>
        </div>

        <span className="geTissueOfOrigin">Tissue of origin</span>
        <div ref="container" style={{ width: this.props.width + "px" }}>
          {this.svgRender()}
        </div>
      </div>
    );
  }
}

const mapStateToProps = (state) => ({ ...state });
const mapDispatchToProps = (dispatch) => ({
  actions: bindActionCreators(Actions, dispatch),
});
export default connect(mapStateToProps, mapDispatchToProps)(Rampage);
