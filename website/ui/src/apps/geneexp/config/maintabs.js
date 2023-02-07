/*
 * SPDX-License-Identifier: MIT
 * Copyright (c) 2016-2020 Michael Purcaro, Henry Pratt, Jill Moore, Zhiping Weng
 */

import React from "react"

import GeneExp from "../components/gene_exp"
import ConfigureGenomeBrowser from "../../search/components/configure_genome_browser"

class GeBigTab extends React.Component {
  shouldComponentUpdate(nextProps, nextState) {
    return "expression" === nextProps.maintabs_active
  }

  render() {
    if ("expression" !== this.props.maintabs_active) {
      return false
    }
    return React.createElement(GeneExp, { ...this.props, useBoxes: true })
  }
}

const MainTabInfo = () => ({
  expression: { title: "Gene Expression", visible: true, f: GeBigTab },
  configgb: { title: "Configure Genome Browser", visible: false, f: ConfigureGenomeBrowser },
})

export default MainTabInfo
