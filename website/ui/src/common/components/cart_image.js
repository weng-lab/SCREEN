/*
 * SPDX-License-Identifier: MIT
 * Copyright (c) 2016-2020 Michael Purcaro, Henry Pratt, Jill Moore, Zhiping Weng
 */

import React from "react"
import { connect } from "react-redux"
import * as ApiClient from "../api_client"

class CartImage extends React.Component {
  constructor(props) {
    super(props)
    this.onClick = this.onClick.bind(this)
  }

  onClick() {
    if (this.props.onClick) {
      this.props.onClick(this.props)
    }
  }

  render() {
    return (
      <object
        type="image/svg+xml"
        data={process.env.PUBLIC_URL + "/re_cart.view.svg"}
        id="shoppingcart_obj"
        ref="svg"
        onClick={this.onClick}
        title="show cart"
      >
        <img src={ApiClient.StaticUrl("/re_cart.view.png")} alt="cart" />
      </object>
    )
  }

  componentDidMount() {
    var onClick = this.onClick
    this.refs.svg.addEventListener("load", () => {
      var svg = this.refs.svg.contentDocument.getElementsByTagName("svg")[0]
      var img = svg.getElementsByTagName("image")[0]
      img.onclick = () => {
        if (this.props.number > 0) {
          onClick()
        }
      }
      this.refs.svg.contentDocument.getElementById("number").firstChild.nodeValue = this.props.number
    })
  }

  componentDidUpdate() {
    this.refs.svg.contentDocument.getElementById("number").firstChild.nodeValue = this.props.number
  }
}

export default CartImage

const click_handler = (dispatch) => (state) => {
  let href = window.location.href
  if (href.includes("&cart")) {
    return
  }
  // go to cart page
  window.open(href + "&cart")
}

const props_map = (state) => {
  return {
    number: state.cart_accessions ? state.cart_accessions.size : 0,
    accessions: state.cart_accessions,
  }
}

const dispatch_map = (dispatch) => {
  return {
    onClick: click_handler(dispatch),
  }
}

export const cart_connector = connect(props_map, dispatch_map)
