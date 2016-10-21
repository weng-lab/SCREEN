var React = require('react');

import {createStore, applyMiddleware} from 'redux'
import {render} from 'react-dom'
import {Provider} from 'react-redux'
import thunkMiddleware from 'redux-thunk'

import {RootReducer} from './reducers/root_reducer'

import MainTabControl from '../search/components/maintab'
import {main_tab_connector, SET_ACCLIST} from './reducers/root_reducer'

let store = createStore(RootReducer, applyMiddleware(thunkMiddleware));

if (document.getElementById('tabs-container-cart')) {

    store.dispatch({
	type: SET_ACCLIST,
	acc_list: INITIAL_ACCLIST
    });
    
    var Tabs = main_tab_connector(MainTabControl);
    render(<Tabs store={store} />, document.getElementById('tabs-container-cart'));
    
}
