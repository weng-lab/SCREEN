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
      if (this.props.items[i].length !== 2) {
        console.error('HeaderMenu: items format should be ["name", "route"]');
        break;
      }
      const name = this.props.items[i][0];
      const route = this.props.items[i][1];
      menuItems.push(
        <Menu.Item
          key={"item-" + i}
          index={i}
          as={Link}
          to={route}
          header={i === 0}
          active={route === this.props.location.pathname}
          color={"blue"}
        >
          {name}
        </Menu.Item>
      );
    }

    return (
      <Menu inverted>
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