import React from 'react'

import {Nav, Navbar, NavItem } from 'react-bootstrap';

import CartImage, {cart_connector} from './cart_image'
import * as ApiClient from '../api_client';

class NavBarApp extends React.Component {
  render() {
    var SearchBox = "";
    if (this.props.searchbox) {
      let SearchBoxC = this.props.searchbox;
	SearchBox = <SearchBoxC uuid={this.props.uuid}
	store={this.props.store} />;
    }

    var cartimage = "";
    if (this.props.show_cartimage) {
      var Cart = cart_connector(CartImage);
      cartimage = <Cart store={this.props.store} />;
      }

      return (
        <Navbar inverse={true}>
          <Navbar.Header>
            <Navbar.Brand>
            <a href={"/"}>
              {"SCREEN"} {this.props.assembly}
              </a>
            </Navbar.Brand>
          </Navbar.Header>
        <Nav>
          <NavItem>{SearchBox}</NavItem>
	      </Nav>
	  <Nav pullRight>
              <NavItem>{cartimage}</NavItem>
          <NavItem href="http://www.encodeproject.org" target="_blank">
              <img src={ApiClient.StaticUrl("/encode/ENCODE_logo.small3.png")}
		   style={{padding: "4px",
			   height: "36px",
			   backgroundColor: "#5cb85c",
			   borderColor: "#4cae4c"}}
                alt={"ENCODE logo"} />
        </NavItem>
        </Nav>
        </Navbar>);
      }
    }

    export default NavBarApp;
