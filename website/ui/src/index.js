import React from 'react'
import ReactDOM from 'react-dom';
import { Router, Route, browserHistory} from 'react-router';
import uuider from 'react-native-uuid';
import Loadable from 'react-loadable';

import loading from './common/components/loading';
import '../node_modules/bootstrap/dist/css/bootstrap.min.css';
import './css.css';

const uuid = uuider.v4();

const addUuid = (Component, props) => {
    return React.createElement(Component, {...props,
					   uuid});
}

const LoadableIndex = Loadable({
    loader: () => import('./apps/index/main'),
    loading: loading("Index"),
});

const LoadableSearch = Loadable({
    loader: () => import('./apps/search/main'),
    loading: loading("search"),
});

const LoadableGeneExp = Loadable({
    loader: () => import('./apps/geneexp/main'),
    loading: loading("gene expression"),
});

const LoadableDe = Loadable({
    loader: () => import('./apps/de/main'),
    loading: loading("DE"),
});

const LoadableGwas = Loadable({
    loader: () => import('./apps/gwas/main'),
    loading: loading("GWAS"),
});

ReactDOM.render((
    <Router history={browserHistory} createElement={addUuid} >
	<Route path={"/"} component={LoadableIndex} />
	<Route path={"/index/:tab"} component={LoadableIndex} />
	<Route path={"/search(.*)"} component={LoadableSearch} />
	<Route path={"/search/:maintab(.*)"} component={LoadableSearch} />
	<Route path={"/search/:maintab/:subtab(.*)"} component={LoadableSearch} />
	<Route path={"/geApp/"} component={LoadableGeneExp} />
	<Route path={"/deApp/"} component={LoadableDe} />
	<Route path={"/gwasApp/"} component={LoadableGwas} />
    </Router>
), document.getElementById('root'));
