var $ = require('jquery');
var React = require('react');
var ReactDOM = require('react-dom');

import {connect} from 'react-redux'

class CartImage extends React.Component {

    constructor(props) {
	super(props);
	this.onClick = this.onClick.bind(this);
    }

    onClick() {
	if (this.props.onClick) this.props.onClick(this.props.store.getState());
    }
    
    render() {
	return (<object type="image/svg+xml" data="/static/re_cart.view.svg" id="shoppingcart_obj" ref="svg"
		   onClick={this.onClick}>
	              <img src="/static/re_cart.view.png" />
	        </object>
	       );
    }

    componentDidMount() {
	var onClick = this.onClick;
	this.refs.svg.addEventListener("load", () => {
	    var svg = this.refs.svg.contentDocument.getElementsByTagName("svg")[0];
	    var img = svg.getElementsByTagName("image")[0];
	    img.onclick = () => {if (this.props.number > 0) onClick();};
	});
    }
    
    componentDidUpdate() {
	this.refs.svg.contentDocument.getElementById("number").firstChild.nodeValue = this.props.number;
    }
    
}
export default CartImage;

const click_handler = (dispatch) => (state) => {
    $.ajax({
        type: "POST",
        url: "/setCart",
        data: JSON.stringify(state.results.cart_list),
        dataType: "json",
        contentType: "application/json",
        success: (response) => {
            if ("err" in response) return true;
	    window.location.href = "/cart";
        }
    });
};

const props_map = (state) => {
    return {
	number: state.results.cart_list.length
    };
};

const dispatch_map = (dispatch) => {
    return {
	onClick: click_handler(dispatch)
    };
};

export const cart_connector = connect(props_map, dispatch_map);
