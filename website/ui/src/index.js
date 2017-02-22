import 'babel-polyfill';

import ReactDOM from 'react-dom';
import { Router, Route, browserHistory} from 'react-router';

import Search from './apps/search/main';
import GeneExp from './apps/geneexp/main';
import De from './apps/de/main';
import Gwas from './apps/gwas/main';
import IndexPage from './apps/index/index';

//import Tf from './apps/tf/main';
//<Route path="/comparison/:assembly" component={Comparison} />
//<Route path="/tfApp/:assembly/" component={Tf} />
//import Comparison from './apps/comparison/main';
// import CartPage from './apps/cart/main';
//     <Route path="/cart" component={CartPage} />

function myCreateElement(Component, props) {
    return (<Component {...props} />);
}

ReactDOM.render(
    (<Router history={browserHistory} createElement={myCreateElement} >
     <Route path="/" component={IndexPage} />
     <Route path="/search(.*)" component={Search} />
     <Route path="/geneexp/:assembly/" component={GeneExp} />
     <Route path="/deGene/:assembly/:geneID" component={De} />
     <Route path="/gwasApp/:assembly" component={Gwas} />
     </Router>),
    document.getElementById('root'));
