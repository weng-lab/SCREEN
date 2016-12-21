import { createStore, applyMiddleware }  from 'redux';
import { Provider, connect } from 'react-redux';
import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import { Router, Route, browserHistory, Link, withRouter } from 'react-router';
import thunk from 'redux-thunk';

import SearchPage from './apps/search/main';
import CartPage from './apps/cart/main';
import GeneExpPage from './apps/geneexp/main';
import ComparisonPage from './apps/comparison/main';

ReactDOM.render((<Router history={browserHistory}>
		    <Route path="/search(.*)" component={SearchPage} />
		    <Route path="/cart" component={CartPage} />
		    <Route path="/geneexp/:assembly/:geneID" component={GeneExpPage} />
		    <Route path="/comparison" component={ComparisonPage} />
		 </Router>), document.getElementById('root'));
