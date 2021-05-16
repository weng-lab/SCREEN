/*
 * SPDX-License-Identifier: MIT
 * Copyright (c) 2016-2020 Michael Purcaro, Henry Pratt, Jill Moore, Zhiping Weng
 */

import React from "react";
import { connect } from "react-redux";
import { bindActionCreators } from "redux";

import * as Actions from "../actions/main_actions";
import * as Render from "../../../common/zrenders";

import LongListFacet from "../../../common/components/longlist";
import Ztable from "../../../common/components/ztable/ztable";

import { panelize } from "../../../common/utility";

const cols = [
  { title: "cell type", data: "name", className: "dt-right" },
  { title: "tissue", data: "tissue", className: "dt-right" },
];

const cellTypesBox1 = ({ globals, ct1, actions }) => {
  return panelize(
    "Cell type 1",
    <LongListFacet
      title={""}
      data={globals.cellTypeInfoArr.filter((x) => x.isde)}
      cols={cols}
      buttonsOff={true}
      selection={ct1}
      friendlySelectionLookup={(value) => {
        return globals.byCellType[value][0]["name"];
      }}
      onTdClick={(value) => {
        actions.setCt1(value);
      }}
    />
  );
};

const cellTypesBox2 = ({ globals, ct2, actions }) => {
  return panelize(
    "Cell type 2",
    <LongListFacet
      title={""}
      data={globals.cellTypeInfoArr.filter((x) => x.isde)}
      cols={cols}
      buttonsOff={true}
      selection={ct2}
      friendlySelectionLookup={(value) => {
        return globals.byCellType[value][0]["name"];
      }}
      onTdClick={(value) => {
        actions.setCt2(value);
      }}
    />
  );
};

const creBox = ({ globals, assembly, des, ct1, ct2, actions }) => {
  if (!des || !ct1 || !ct2) {
    return <div />;
  }
  let cres = des.diffCREs.data;
  let box = (
    <Ztable
      data={cres}
      cols={[
        {
          title: "accession",
          data: "accession",
          render: Render.relink(assembly),
        },
        { title: "start", data: "start", render: Render.integer },
        { title: "len", data: "len", render: Render.integer },
        { title: <span>&Delta;Z</span>, data: "value" },
      ]}
      pageLength={5}
      bFilter={true}
      sortCol={["value", false]}
    />
  );
  return panelize(
    "candidate cis-Regulatory Elements",
    box,
    "DE_cRE_Table",
    globals
  );
};

const geneBox = ({ globals, des, ct1, ct2, actions }) => {
  if (!des || !ct1 || !ct2) {
    return <div />;
  }
  let genes = des.nearbyDEs.data;
  let box = (
    <Ztable
      data={genes}
      cols={[
        { title: "gene", data: "gene" },
        { title: "start", data: "sstart" },
        { title: <span>fold &Delta;</span>, data: "fc", render: Render.real },
      ]}
      pageLength={5}
      bFilter={true}
      sortCol={["fc", false]}
    />
  );
  return panelize(
    "Differentially Expressed Genes",
    box,
    "DE_Gene_Table",
    globals
  );
};

class FacetBoxen extends React.Component {
  doRender(p) {
    const geneRed = "#FF0000";
    const geneBlue = "#1E90FF";

    let legend = (
      <div>
        <p style={{ color: geneRed }}>{"Watson (+) strand"}</p>
        <p style={{ color: geneBlue }}>{"Crick (-) strand"}</p>
      </div>
    );

    return (
      <div>
        {cellTypesBox1(p)}
        {cellTypesBox2(p)}
        {creBox(p)}
        {geneBox(p)}
        {legend}
      </div>
    );
  }

  render() {
    return this.doRender(this.props);
  }
}

const mapStateToProps = (state) => ({ ...state });
const mapDispatchToProps = (dispatch) => ({
  actions: bindActionCreators(Actions, dispatch),
});
export default connect(mapStateToProps, mapDispatchToProps)(FacetBoxen);
