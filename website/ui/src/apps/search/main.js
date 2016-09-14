var React = require('react');

import {createStore} from 'redux'
import {render} from 'react-dom'
import {Provider} from 'react-redux'

import {RootReducer} from './reducers/root_reducer'
import FacetApp from './components/facet_app'

if (document.getElementById('facets-container')) {
    let store = createStore(RootReducer);
    render(<FacetApp store={store} />, document.getElementById('facets-container'));
}
