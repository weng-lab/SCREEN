import React from 'react'
import ReactDOM from 'react-dom';
import { Router, Route, browserHistory} from 'react-router';
import uuider from 'react-native-uuid';

import Search from './apps/search/main';
import GeneExp from './apps/geneexp/main';
import De from './apps/de/main';
import Gwas from './apps/gwas/main';
import IndexPage from './apps/index/main';

import '../node_modules/bootstrap/dist/css/bootstrap.min.css';
import './css.css';

const uuid = uuider.v4();

const myCreateElement = (Component, props) => {
    return React.createElement(Component, {...props,
					   uuid});
}

let root = '/' + process.env.PUBLIC_URL.split('/').slice(3).join('/');

ReactDOM.render((
    <Router history={browserHistory} createElement={myCreateElement} >
	<Route path={root + "/"} component={IndexPage} />
	<Route path={root + "/index/:tab"} component={IndexPage} />
	<Route path={root + "/search(.*)"} component={Search} />
	<Route path={root + "/search/:maintab(.*)"} component={Search} />
	<Route path={root + "/search/:maintab/:subtab(.*)"} component={Search} />
	<Route path={root + "/geApp/"} component={GeneExp} />
	<Route path={root + "/deApp/"} component={De} />
	<Route path={root + "/gwasApp/"} component={Gwas} />
    </Router>
), document.getElementById('root'));
