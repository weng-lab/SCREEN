var React = require('react');

import {createStore, applyMiddleware} from 'redux'
import {render} from 'react-dom'
import {Provider} from 'react-redux'
import thunkMiddleware from 'redux-thunk'

import {RootReducer} from './reducers/root_reducer'
import FacetApp from './components/facet_app'
import ResultsApp from './components/results_app'
import CartImage, {cart_connector} from './components/cart_image'

import {expression_heatmap_connector} from './components/expression_heatmap'
import Heatmap from '../../common/components/heatmap'

let store = createStore(RootReducer, applyMiddleware(thunkMiddleware));

if (document.getElementById('facets-container')) {
    render(<FacetApp store={store} pquery={ParsedQuery} />, document.getElementById('facets-container'));
}

if (document.getElementById('results-container')) {
    render(<ResultsApp store={store} />, document.getElementById('results-container'));
}

if (document.getElementById('cartimage-container')) {
    var Cart = cart_connector(CartImage);
    render(<Cart store={store} />, document.getElementById('cartimage-container'));
}

if (document.getElementById('expression_heatmap')) {
    var ExpressionHeatmap = expression_heatmap_connector(Heatmap);
    render(<ExpressionHeatmap store={store} />, document.getElementById('expression_heatmap'));
}
