/*
 * SPDX-License-Identifier: MIT
 * Copyright (c) 2016-2020 Michael Purcaro, Henry Pratt, Jill Moore, Zhiping Weng
 */

// from https://codesandbox.io/s/ryooz4wrwn?file=/src/index.js

import React, { Component } from "react";
import PropTypes from "prop-types";
import { Menu, Container, Icon } from "semantic-ui-react";
import { Link, withRouter } from "react-router-dom";

class HeaderMenu extends Component {
  render() {
    let menuItems = [];
    for (let i = 0; i < this.props.items.length; i++) {
      if (this.props.items[i].length !== 3) {
        console.error('HeaderMenu: items format should be ["name", "route", "visible"]');
        break;
      }
      const name = this.props.items[i][0];
      const route = this.props.items[i][1];
      const visible = this.props.items[i][2];

      if(!visible){
        continue;
      }

      const active = route === this.props.location.pathname;

      menuItems.push(
        <Menu.Item
          key={"item-" + i}
          index={i}
          as={Link}
          to={route}
          header={i === 0}
          active={active}
          color={"blue"}
          style={{color: active ? "white" : "black"}}
        >
          {name}
        </Menu.Item>
      );
    }

    return (
      <Menu inverted pointing style={{backgroundColor: "rgb(255, 235, 200)", marginTop: 0}}>
        <Container>{menuItems}</Container>
      </Menu>
    );
  }
}

HeaderMenu.propTypes = {
  onItemClick: PropTypes.func.isRequired,
  items: PropTypes.arrayOf(PropTypes.array.isRequired).isRequired
};

export default withRouter(HeaderMenu);