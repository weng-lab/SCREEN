/*
 * SPDX-License-Identifier: MIT
 * Copyright (c) 2016-2020 Michael Purcaro, Henry Pratt, Jill Moore, Zhiping Weng
 */

import React from "react"
import { connect } from "react-redux"
import { bindActionCreators } from "redux"

import * as Actions from "../actions/main_actions"

import LongChecklistFacet from "../../../common/components/longchecklist"

import { CHECKLIST_MATCH_ANY } from "../../../common/components/checklist"
import { panelize } from "../../../common/utility"

const bts = ({ biosample_types, biosample_types_selected, actions }) => {
  return panelize(
    "Biosample Types",
    <LongChecklistFacet
      title={""}
      data={biosample_types.map((e) => {
        return { key: e, selected: biosample_types_selected.has(e) }
      })}
      cols={[
        {
          title: "",
          data: "key",
          className: "dt-right",
        },
      ]}
      order={[]}
      buttonsOff={true}
      noSearchBox={true}
      noTotal={true}
      mode={CHECKLIST_MATCH_ANY}
      onTdClick={(c) => {
        actions.toggleBiosampleType(c)
      }}
    />
  )
}

const cell_compartments = ({ compartments, actions, compartments_selected }) => {
  return panelize(
    "Cellular Compartments",
    <LongChecklistFacet
      title={""}
      data={compartments.map((e) => {
        return { key: e, selected: compartments_selected.has(e) }
      })}
      cols={[
        {
          title: "",
          data: "key",
          className: "dt-right",
        },
      ]}
      order={[]}
      noSearchBox={true}
      noTotal={true}
      buttonsOff={true}
      mode={CHECKLIST_MATCH_ANY}
      onTdClick={(c) => {
        actions.toggleCompartment(c)
      }}
    />
  )
}

class FacetBoxen extends React.Component {
  doRender(p) {
    return (
      <div>
        {bts(p)}
        {"mm10" !== p.assembly && cell_compartments(p)}
      </div>
    )
  }

  render() {
    return this.doRender(this.props)
  }
}

const mapStateToProps = (state) => ({ ...state })
const mapDispatchToProps = (dispatch) => ({
  actions: bindActionCreators(Actions, dispatch),
})
export default connect(mapStateToProps, mapDispatchToProps)(FacetBoxen)
