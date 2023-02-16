/*
 * SPDX-License-Identifier: MIT
 * Copyright (c) 2016-2020 Michael Purcaro, Henry Pratt, Jill Moore, Zhiping Weng
 */

import React from "react"

import * as ApiClient from "../api_client"

export class ListItem extends React.Component {
  constructor(props) {
    super(props)
    this.onclick = this.onclick.bind(this)
  }

  onclick() {
    if (this.props.onclick) {
      this.props.onclick(this.props.value)
    }
  }

  render() {
    var classname, rtxt
    if (this.props.selected) {
      classname = "result_row_selected"
      rtxt = <img src={ApiClient.StaticUrl("/x.png")} alt="check/uncheck" />
    } else {
      classname = "result_row"
      rtxt = this.props.n
    }

    return (
      <div>
        <div className={classname} key={this.props.value}>
          {this.props.draggable &&
            this.props.draggable(
              <span>
                <span className="glyphicon glyphicon-align-justify" />{" "}
              </span>
            )}

          <a onClick={this.onclick}>
            <span>{this.props.value}</span>
            <span className="pull-right">{rtxt}</span>
          </a>
        </div>
      </div>
    )
  }
}

class ListFacet extends React.Component {
  constructor(props) {
    super(props)
    this.click_handler = this.click_handler.bind(this)
  }

  click_handler(k) {
    if (k === this.props.selection) {
      k = null
    }
    if (this.props.onchange) {
      this.props.onchange(k)
    }
  }

  render() {
    let click_handler = this.click_handler
    const s = this.props.selection

    let items = this.props.items.map(function (kv) {
      let key = kv[0]
      let val = kv[1]
      let selected = key === s

      if (s === null || selected) {
        return <ListItem onclick={click_handler} value={key} key={key} n={val} selected={selected} />
      } else {
        return <div key={key} />
      }
    })
    return <div>{items}</div>
  }
}
export default ListFacet
