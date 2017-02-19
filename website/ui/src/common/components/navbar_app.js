import React from 'react'
import ReactDOM from 'react-dom'

import CartImage, {cart_connector} from './cart_image'

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
	    cartimage = (<form
                         className="navbar-form navbar-right"
                         id="cartimage-container"
                         title="view cart">
                         <Cart store={this.props.store} />
                         </form>);
	}

	return (<div className="navbar-header">
		<a className="navbar-brand" href={HOMEPAGE.url}>
                {HOMEPAGE.title} {GlobalAssembly}
                </a>

                {SearchBox}

                <form className="navbar-form navbar-right">
		<a href="http://www.encodeproject.org"
                target="_blank"
                className="btn btn-success btn-lg navbarEncodeImgBtn">
                <img src={"/static/encode/ENCODE_logo.small2.png"}
                alt={"ENCODE logo"}
                className={"navbarEncodeImg"} />
                </a>
		</form>

		{cartimage}

		</div>);
    }
}

export default NavBarApp;
