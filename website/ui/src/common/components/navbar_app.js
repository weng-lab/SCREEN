/*
 * SPDX-License-Identifier: MIT
 * Copyright (c) 2016-2020 Michael Purcaro, Henry Pratt, Jill Moore, Zhiping Weng
 */

import React from "react";
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

      <Navbar inverse={true}>
        <Navbar.Brand>
          <a href={"/"}>SCREEN</a>
        </Navbar.Brand>
        <Nav>
          <NavItem>
            <SearchBox
              uuid={this.props.uuid}
              assembly={this.props.assembly}
              store={this.props.store}
            />
          </NavItem>
        </Nav>
        <Nav pullRight>
          <NavItem>{cartimage}</NavItem>
          <NavItem href="http://www.encodeproject.org" target="_blank">
            <img
              src={ApiClient.StaticUrl("/encode/ENCODE_logo.small3.png")}
              style={{
                padding: "4px",
                height: "36px",
                backgroundColor: "#5cb85c",
                borderColor: "#4cae4c",
              }}
              alt={"ENCODE logo"}
            />
          </NavItem>
        </Nav>
      </Navbar>
    );
  }
}

export default NavBarApp;
