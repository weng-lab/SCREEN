import 'babel-polyfill'

import ReactDOM from 'react-dom';
import { Router, Route, browserHistory} from 'react-router';

import Search from './apps/search/main';
// import CartPage from './apps/cart/main';
import GeneExp from './apps/geneexp/main';
import De from './apps/de/main';
import Gwas from './apps/gwas/main';
import Tf from './apps/tf/main';
import Comparison from './apps/comparison/main';

//     <Route path="/cart" component={CartPage} />


ReactDOM.render(
    (<Router history={browserHistory}>
     <Route path="/comparison/:assembly/" component={Comparison} />
     <Route path="/deGene/:assembly/:geneID" component={De} />
     <Route path="/geneexp/:assembly/:geneID" component={GeneExp} />
     <Route path="/gwasApp/:assembly/" component={Gwas} />
     <Route path="/search(.*)" component={Search} />
     <Route path="/tfApp/:assembly/" component={Tf} />
     </Router>),
    document.getElementById('root'));
