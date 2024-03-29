/*
 * SPDX-License-Identifier: MIT
 * Copyright (c) 2016-2020 Michael Purcaro, Henry Pratt, Jill Moore, Zhiping Weng
 */

import React from "react"
import { connect } from "react-redux"
import { bindActionCreators } from "redux"

import * as Actions from "../actions"

import * as Render from "../../../common/zrenders"
import { tabPanelize } from "../../../common/utility"
import Ztable from "../../../common/components/ztable/ztable"

class TabQuery extends React.Component {
  constructor(props) {
    super(props)
    this.key = "query"
  }

  shouldComponentUpdate(nextProps, nextState) {
    return this.key === nextProps.maintabs_active
  }

  render() {
    let data = this.props.genes

    let cols = [
      { title: "", data: "sm", visible: false },
      { title: "gene", data: "approved_symbol", render: Render.searchLink(data, this.props.uuid) },
      { title: "", data: "oname" },
      { title: "chrom", data: "chrom" },
      { title: "start", data: "start", render: Render.integer },
      { title: "stop", data: "stop", render: Render.integer },
      { title: "strand", data: "strand" },
    ]

    let order = [[0, "desc"]]

    return tabPanelize(
      <div>
        <h2>Possible Gene Matches</h2>
        <Ztable data={data.genes} cols={cols} order={order} bFilter={true} />
      </div>
    )
  }
}

const mapStateToProps = (state) => ({ ...state })
const mapDispatchToProps = (dispatch) => ({
  actions: bindActionCreators(Actions, dispatch),
})
export default connect(mapStateToProps, mapDispatchToProps)(TabQuery)
