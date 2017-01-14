import React from 'react'

import {createStore, applyMiddleware} from 'redux'
import {render} from 'react-dom'
import {Provider} from 'react-redux'
import thunkMiddleware from 'redux-thunk'

import {RootReducer} from './reducers/root_reducer'

import NavBarApp from '../../common/components/navbar_app'
import MainTabControl from './components/maintab'
import {main_tab_connector, SET_ACCLIST} from './reducers/root_reducer'

class CartPage extends React.Component {

    constructor(props) {
	super(props);
	this.store = createStore(RootReducer, applyMiddleware(thunkMiddleware));
    }

    render() {
	var Tabs = main_tab_connector(MainTabControl);
	return (<div>
		   <nav id="mainNavBar" className="navbar navbar-default navbar-inverse">
		      <div className="container-fluid" id="navbar-main"><NavBarApp show_cartimage={false} show_searchbox={true} store={this.store} /></div>
		   </nav>
		   <div className="container" style={{width: "100%"}}>
		      <div className="row" style={{width: "100%"}}>
		         <div className="col-md-12 nopadding-left" id="tabs-container-cart">
		            <Tabs store={this.store} />
		         </div>
                      </div>
                   </div>
		</div>);
    }

    componentDidMount() {
	this.store.dispatch({
	    type: SET_ACCLIST,
	    acc_list: INITIAL_ACCLIST
	});
    }

}
export default CartPage;
