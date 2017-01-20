import 'babel-polyfill'

import ReactDOM from 'react-dom';
import { Router, Route, browserHistory} from 'react-router';

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
