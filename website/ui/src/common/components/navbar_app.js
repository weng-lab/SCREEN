/*
 * SPDX-License-Identifier: MIT
 * Copyright (c) 2016-2020 Michael Purcaro, Henry Pratt, Jill Moore, Zhiping Weng
 */

import React from "react";
import { Link } from 'react-router-dom'
import { Input, Menu } from 'semantic-ui-react'

import SearchBox from "./searchbox";
import CartImage, { cart_connector } from "./cart_image";
import * as ApiClient from "../api_client";

class NavBarApp extends React.Component {
  render() {
    var cartimage = "";
    if (this.props.show_cartimage) {
      let Cart = cart_connector(CartImage);
      cartimage = <Cart store={this.props.store} />;
    }

    return (
      <Menu inverted style={{marginBottom: 0 }}>
        <Menu.Item name='home' as={Link} to="/">{"SCREEN"}</Menu.Item>

        <Menu.Item name="search">
          <SearchBox uuid={this.props.uuid} assembly={this.props.assembly} store={this.props.store} />
        </Menu.Item>

        <Menu.Item name="cart">
          {cartimage}
        </Menu.Item>

        <Menu.Item name="encode" as={Link} to={{ pathname: "https://www.encodeproject.org" }} target="_blank" rel="noopener noreferrer">
          <img src={ApiClient.StaticUrl("/encode/ENCODE_logo.small3.png")}
            style={{
              padding: "4px",
              height: "36px",
              backgroundColor: "#5cb85c",
              borderColor: "#4cae4c",
            }}
            alt={"ENCODE logo"}
          />
        </Menu.Item>

      </Menu>
    )
  }
}

export default NavBarApp;
