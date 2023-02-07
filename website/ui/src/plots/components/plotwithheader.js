/*
 * SPDX-License-Identifier: MIT
 * Copyright (c) 2016-2020 Michael Purcaro, Henry Pratt, Jill Moore, Zhiping Weng
 */

import React from "react"

const header = (text, size) => {
  if (1 === size) return <h1>{text}</h1>
  if (2 === size) return <h2>{text}</h2>
  if (3 === size) return <h3>{text}</h3>
  return <h4>{text}</h4>
}

class PlotWithHeader extends React.Component {
  render() {
    return (
      <div className={"col-md-" + this.props.colspan}>
        {header(this.props.text, this.props.headersize)}
        <div style={{ position: "relative", height: this.props.height + "px", width: "100%" }}>{this.props.children}</div>
      </div>
    )
  }
}
export default PlotWithHeader
