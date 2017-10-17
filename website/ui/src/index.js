import React from 'react'
import ReactDOM from 'react-dom';
import { Router, Route, browserHistory} from 'react-router';
import uuider from 'react-native-uuid';

import Intersection from './apps/intersection/main';
import Search from './apps/search/main';
import GeneExp from './apps/geneexp/main';
import De from './apps/de/main';
import Gwas from './apps/gwas/main';
import IndexPage from './apps/index/main';
import TadPage from './apps/tads/main';

import '../node_modules/bootstrap/dist/css/bootstrap.min.css';
import './css.css';

const uuid = uuider.v4();

const myCreateElement = (Component, props) => {
    return React.createElement(Component, {...props,
					   uuid});
}

ReactDOM.render((
    <Router history={browserHistory} createElement={myCreateElement} >
	<Route path="/" component={IndexPage} />
	<Route path="/index/:tab" component={IndexPage} />
	<Route path="/search(.*)" component={Search} />
	<Route path="/search/:maintab(.*)" component={Search} />
	<Route path="/search/:maintab/:subtab(.*)" component={Search} />
	<Route path="/geApp/" component={GeneExp} />
	<Route path="/deApp/" component={De} />
	<Route path="/gwasApp/" component={Gwas} />
	<Route path="/intersections/:assembly" component={Intersection} />
	<Route path="/tads/:assembly" component={TadPage} />
    </Router>
), document.getElementById('root'));
