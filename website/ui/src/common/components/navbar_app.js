var React = require('react');
var ReactDOM = require('react-dom');

import CartImage, {cart_connector} from './cart_image'

class NavBarApp extends React.Component {

    constructor(props) {
	super(props);
    }

    render() {

	var SearchBox = "";
	if (this.props.searchbox) {
	    var SearchBoxC = this.props.searchbox;
	    SearchBox = <SearchBoxC store={this.props.store} />;
	}
	
	var cartimage = "";
	if (this.props.show_cartimage) {
	    var Cart = cart_connector(CartImage);
	    cartimage = <form className="navbar-form navbar-right" id="cartimage-container"><Cart store={this.props.store} /></form>;
	}
	
	return (<div className="navbar-header">
		   <a className="navbar-brand" href={HOMEPAGE.url}>{HOMEPAGE.title}</a>
		   {SearchBox}
		   <form className="navbar-form navbar-right">
		      <a href="http://www.encodeproject.org" target="_blank" className="btn btn-success btn-lg encodeButton">ENCODE</a>
		   </form>
		   {cartimage}
		</div>);

    }

}
export default NavBarApp;
