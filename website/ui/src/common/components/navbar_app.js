import React from 'react'

import {Nav, Navbar, NavItem } from 'react-bootstrap';

import SearchBox from './searchbox'
import CartImage, {cart_connector} from './cart_image'
import * as ApiClient from '../api_client';

let root = '/' + process.env.PUBLIC_URL.split('/').slice(3).join('/');

class NavBarApp extends React.Component {
    render() {
	var cartimage = "";
	if (this.props.show_cartimage) {
	    let Cart = cart_connector(CartImage);
	    cartimage = <Cart store={this.props.store} />;
	}
	
	return (
            <Navbar inverse={true}>
		<Navbar.Header>
		    <Navbar.Brand>
			<a href={root}>
			    {"SCREEN"} GRCh38
			</a>
		    </Navbar.Brand>
		</Navbar.Header>
		<Nav>
		    <NavItem>
			<SearchBox uuid={this.props.uuid}
				   assembly={this.props.assembly}
				   store={this.props.store} />
	    	    </NavItem>
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
