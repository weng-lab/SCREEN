/*
 * SPDX-License-Identifier: MIT
 * Copyright (c) 2016-2020 Michael Purcaro, Henry Pratt, Jill Moore, Zhiping Weng
 */

import React from 'react'
import ReactDOM from 'react-dom';
import { Switch, Route, Router, Link } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import Loadable from 'react-loadable'; // TODO: remove and change to https://btholt.github.io/complete-intro-to-react-v5/code-splitting

import SearchPage from './apps/search/main';


import 'bootstrap/dist/css/bootstrap.min.css';
import './css.css';


import ReactGA from 'react-ga';
import { createBrowserHistory } from 'history';

ReactGA.initialize('UA-93680006-1');
const h = createBrowserHistory();
h.listen((location, _) => {
    ReactGA.set({ page: location.pathname });
    ReactGA.pageview(location.pathname);
});

const uuid = uuidv4();

const addUuid = (Component, props) => {
    return React.createElement(Component, {...props,
					   uuid});
}

class Loading extends React.Component {
    render() {
	let msg = this.props.message;
	if (!msg) {
	    msg = "";
	}
	return (
		<div className={"loading"} style={{"display": "block"}}>
		Loading... {msg}
		<i className="fa fa-refresh fa-spin" style={{fontSize: "24px"}} />
		</div>);
    }
};

const LoadableIndex = Loadable({
    loader: () => import('./apps/index/main'),
    loading: Loading,
});



const LoadableGeneExp = Loadable({
    loader: () => import('./apps/geneexp/main'),
    loading: Loading,
});

const LoadableDe = Loadable({
    loader: () => import('./apps/de/main'),
    loading: Loading,
});

const LoadableGwas = Loadable({
    loader: () => import('./apps/gwas/main'),
    loading: Loading
});

ReactDOM.render((
    <Router history={h}>
	<Switch>
	    <Route exact path={"/"}>
		<LoadableIndex />
	    </Route>
	    <Route path={"/downloads"}>
		
	    </Route>
	    <Route path={"/index/:tab"}>
		<LoadableIndex />
	    </Route>
	    <Route path={"/search(.*)"}>
		<SearchPage />
	    </Route>
	    <Route path={"/search/:maintab(.*)"}>
		<SearchPage />
	    </Route>
	    <Route path={"/search/:maintab/:subtab(.*)"}>
		<SearchPage />
	    </Route>
	    <Route path={"/geApp/"}>
		<LoadableGeneExp />
	    </Route>
	    <Route path={"/deApp/"}>
		<LoadableDe />
	    </Route>
	    <Route path={"/gwasApp/"}>
		<LoadableGwas />
	    </Route>
	</Switch>
    </Router>
), document.getElementById('root'));
