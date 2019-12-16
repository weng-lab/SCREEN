import React from 'react'
import ReactDOM from 'react-dom';
import { Router, Route, browserHistory} from 'react-router';
import uuider from 'react-native-uuid';
import Loadable from 'react-loadable';

import '../node_modules/bootstrap/dist/css/bootstrap.min.css';
import './css.css';

const uuid = uuider.v4();

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
