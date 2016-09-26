var React = require('react');
var ReactDOM = require('react-dom');

import {connect} from 'react-redux'

class CartImage extends React.Component {

    constructor(props) {
	super(props);
    }

    render() {
	return (<object type="image/svg+xml" data="/static/re_cart.view.svg" id="shoppingcart_obj" ref="svg">
	            <img src="/static/re_cart.view.png" />
	          </object>
	       );
    }
    
    componentDidUpdate() {
	this.refs.svg.contentDocument.getElementById("number").firstChild.nodeValue = this.props.number;
    }
    
}
export default CartImage;

const props_map = (state) => {
    return {
	number: state.results.cart_list.length
    };
};

const dispatch_map = (dispatch) => {
    return {};
};

export const cart_connector = connect(props_map, dispatch_map);
