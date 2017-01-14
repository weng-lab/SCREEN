var React = require('react');
import {createStore, applyMiddleware} from 'redux'
import {Provider} from 'react-redux'
import thunkMiddleware from 'redux-thunk'
import createLogger from 'redux-logger'

import NavBarApp from '../../common/components/navbar_app'
import SearchBox from '../../common/components/searchbox'
import FacetBoxen from './components/facetboxen'
import main_reducers from './reducers/main_reducers'

const loggerMiddleware = createLogger();

const initialState = {
        ...GlobalParsedQuery,
    tfs_selection: new Set(), tfs_mode: null,
    gene_all_start: 0, gene_all_end: 5000000,
    gene_pc_start: 0, gene_pc_end: 5000000,
    rank_dnase_start: 0, rank_dnase_end: 20000,
    rank_promoter_start: 0, rank_promoter_end: 20000,
    rank_enhancer_start: 0, rank_enhancer_end: 20000,
    rank_ctcf_start: 0, rank_ctcf_end: 20000
};

const store = createStore(main_reducers,
                          initialState,
                          applyMiddleware(
                              thunkMiddleware,
                              loggerMiddleware
                          ));

console.log(store.getState());

class SearchPage extends React.Component {
    render() {
        return (
                <Provider store={store}>
	        <div>

		<nav id="mainNavBar" className="navbar navbar-default navbar-inverse navbar-main">
		<div className="container-fluid" id="navbar-main">
                <NavBarApp show_cartimage={false} searchbox={SearchBox} />}/>
                </div>
		</nav>

		<div className="container" style={{width: "100%"}}>
                  <div className="row" style={{width: "100%"}}>
                    <div className="col-md-3 nopadding-right" id="facets-container">
                    <FacetBoxen />
                    </div>
                  <div className="col-md-9 nopadding-left" id="tabs-container">

                  </div>
                </div>
                </div>
		</div>
                </Provider>
        );
    }
}
export default SearchPage;
