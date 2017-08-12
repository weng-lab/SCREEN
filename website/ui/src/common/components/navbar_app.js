import React from 'react'

import CartImage, {cart_connector} from './cart_image'

/*global HOMEPAGE */
/*global GlobalAssembly */
/*eslint no-undef: "error"*/

class NavBarApp extends React.Component {
    render() {
	var SearchBox = "";
	if (this.props.searchbox) {
	    var SearchBoxC = this.props.searchbox;
	    SearchBox = <SearchBoxC store={this.props.store} />;
	}

	var cartimage = "";
	if (this.props.show_cartimage) {
	    var Cart = cart_connector(CartImage);
	    cartimage = (
		<form
                    className="navbar-form navbar-right"
                    id="cartimage-container"
                    title="view cart">
                    <Cart store={this.props.store} />
                </form>);
	}

	return (
	    <div className="navbar-header">
		<a className="navbar-brand" href={HOMEPAGE.url}>
		    {HOMEPAGE.title} {GlobalAssembly}
                </a>
		
                {SearchBox}
		
                <form className="navbar-form navbar-right">
		    <a href="http://www.encodeproject.org"
                       target="_blank"
		       rel="noopener noreferrer"
                       className="btn btn-success btn-lg navbarEncodeImgBtn">
			<img src={"/static/encode/ENCODE_logo.small3.png"}
			     alt={"ENCODE logo"}
			     className={"navbarEncodeImg"} />
                    </a>
		</form>
		
		{cartimage}
		
	    </div>);
    }
}

export default NavBarApp;
