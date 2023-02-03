/*
 * SPDX-License-Identifier: MIT
 * Copyright (c) 2016-2020 Michael Purcaro, Henry Pratt, Jill Moore, Zhiping Weng
 */

import React from 'react'
import ReactDOM from 'react-dom';
import { Router, Route, browserHistory, Redirect } from 'react-router';
// import Search from './apps/search/main';
// import GeneExp from './apps/geneexp/main';
// import De from './apps/de/main';
// import Gwas from './apps/gwas/main';
import IndexPage from './apps/index/main'; // this effects the font of the site
// import { LDR } from './apps/index/components/LDR/LDR';
import { v4 as uuidv4 } from 'uuid';
import Loadable from 'react-loadable';

import '../node_modules/bootstrap/dist/css/bootstrap.min.css';
import './css.css';

import ReactGA from 'react-ga';
// import { createBrowserHistory } from 'history';

ReactGA.initialize('UA-93680006-1');
ReactGA.pageview(window.location.pathname + window.location.search);

const h = browserHistory;
h.listen((location, action) => {
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

const LoadableSearch = Loadable({
    loader: () => import('./apps/search/main'),
    loading: Loading
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

const LoadableLDR = Loadable({
    loader: () => import('./apps/index/components/LDR/LDR'),
    loading: Loading
});

ReactDOM.render((
    <Router history={h} createElement={addUuid} >
	<Route path={"/"} component={LoadableIndex} />
	<Route path={"/downloads"} render={ () => <Redirect to="/index/files" /> } />
	<Route path={"/index/:tab"} component={LoadableIndex} />
	<Route path={"/search/:maintab/:subtab(.*)"} component={LoadableSearch} />
	<Route path={"/search/:maintab(.*)"} component={LoadableSearch} />
	<Route path={"/search(.*)"} component={LoadableSearch} />
	<Route path={"/geApp/"} component={LoadableGeneExp} />
	<Route path={"/deApp/"} component={LoadableDe} />
	<Route path={"/gwasApp/"} component={LoadableGwas} />
	<Route path="/ldr/" component={LoadableLDR} />
    </Router>
), document.getElementById('root'));
