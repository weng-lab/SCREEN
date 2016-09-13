var React = require('react');

import {createStore} from 'redux'
import {render} from 'react-dom'
import {Provider} from 'react-redux'

import {RootReducer} from './reducers/root_reducer'
import FacetApp from './components/facet_app'

if (document.getElementById('facets-container')) {
    let store = createStore(RootReducer);
    let facet_app = FacetApp(store);
    render(<Provider store={store}>
	       {facet_app}
	   </Provider>, document.getElementById('facets-container')
    );
}
