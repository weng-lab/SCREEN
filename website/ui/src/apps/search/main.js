var React = require('react');

import {createStore, applyMiddleware} from 'redux'
import {render} from 'react-dom'
import {Provider} from 'react-redux'
import thunkMiddleware from 'redux-thunk'
import createLogger from 'redux-logger'

import {get_root_reducer} from './reducers/root_reducer'
import FacetBoxen from './components/facetboxen'

import SearchBox from '../../common/components/searchbox'

import MainTabControl from './components/maintab'
import NavBarApp from '../../common/components/navbar_app'
import {main_tab_connector, main_searchbox_connector, default_state} from './reducers/root_reducer'
import {facetboxes, facetbox_render_order, es_links} from './config/facetboxes'
import {maintabs} from './config/maintabs'

import facetboxen_reducers from './reducers/facetboxen_reducers'

import {invalidate_results} from './helpers/invalidate_results'

const loggerMiddleware = createLogger();

const initialState = {
        ...GlobalParsedQuery,
    gene_all_start: 0, gene_all_end: 5000000,
    gene_pc_start: 0, gene_pc_end: 5000000,
    rank_dnase_start: 0, rank_dnase_end: 20000,
    rank_promoter_start: 0, rank_promoter_end: 20000,
    rank_enhancer_start: 0, rank_enhancer_end: 20000,
    rank_ctcf_start: 0, rank_ctcf_end: 20000
};

const store = createStore(facetboxen_reducers, initialState,
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
                <NavBarApp show_cartimage={false} />
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
