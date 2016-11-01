var React = require('react');
var ReactDOM = require('react-dom');

import CartImage, {cart_connector} from './cart_image'

export class NavBarApp extends React.Component {

    constructor(props) {
	super(props);
    }

    render() {
	
	var searchbox = (!this.props.show_searchbox ? ""
			 : (<form action="search" method="get" id="searchformNavbar" className="navbar-collapse">
			       <input className="searchbox" type="text" size="100" name="q" id="queryBox" />
			       <a className="btn btn-primary btn-lg searchButton" href="javascript:searchformNavbar.submit();" role="button">Search</a>
			    </form>));
	
	var cartimage = "";
	if (this.props.show_cartimage) {
	    var Cart = cart_connector(CartImage);
	    cartimage = <form className="navbar-form navbar-right" id="cartimage-container"><Cart store={this.props.store} /></form>;
	}
	
	return (<div className="navbar-header">
		   <a className="navbar-brand" href={HOMEPAGE.url}>{HOMEPAGE.title}</a>
		   <form className="navbar-form navbar-right">
		      <a href="http://www.encodeproject.org" target="_blank" className="btn btn-success btn-lg encodeButton">ENCODE</a>
		   </form>
		   {searchbox}
		   {cartimage}
		</div>);

    }

}
export default NavBarApp;
