import 'babel-polyfill';

import ReactDOM from 'react-dom';
import { Router, Route, browserHistory} from 'react-router';

import Intersection from './apps/intersection/main';
import Search from './apps/search/main';
import GeneExp from './apps/geneexp/main';
import De from './apps/de/main';
import Gwas from './apps/gwas/main';
import IndexPage from './apps/index/main';

function myCreateElement(Component, props) {
    return (<Component {...props} />);
}

console.log(Intersection);

ReactDOM.render((
    <Router history={browserHistory} createElement={myCreateElement} >
	<Route path="/" component={IndexPage} />
	<Route path="/index/:tab" component={IndexPage} />
	<Route path="/search(.*)" component={Search} />
	<Route path="/search/:maintab(.*)" component={Search} />
	<Route path="/search/:maintab/:subtab(.*)" component={Search} />
	<Route path="/geApp/:assembly/" component={GeneExp} />
	<Route path="/deApp/:assembly/" component={De} />
	<Route path="/gwasApp/:assembly" component={Gwas} />
	<Route path="/intersections/:assembly" component={Intersection} />
    </Router>), document.getElementById('root'));
