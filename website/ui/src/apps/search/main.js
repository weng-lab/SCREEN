var React = require('react');

import {createStore, applyMiddleware} from 'redux'
import {render} from 'react-dom'
import {Provider} from 'react-redux'
import thunkMiddleware from 'redux-thunk'

import {RootReducer} from './reducers/root_reducer'
import FacetApp from './components/facet_app'

if (document.getElementById('facets-container')) {
    let store = createStore(RootReducer, applyMiddleware(thunkMiddleware));
    render(<FacetApp store={store} />, document.getElementById('facets-container'));
}
