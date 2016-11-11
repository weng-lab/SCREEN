var React = require('react');

import {createStore, applyMiddleware} from 'redux'
import {render} from 'react-dom'
import {Provider} from 'react-redux'
import thunkMiddleware from 'redux-thunk'

import {get_root_comparison_reducer} from './reducers/comparison_reducer'
import FacetApp from '../search/components/facet_app'
import MainVennDiagram from './components/venn'

import SearchBox from '../../common/components/searchbox'

import MainTabControl from '../search/components/maintab'
import NavBarApp from '../../common/components/navbar_app'
import {main_tab_connector, main_searchbox_connector} from '../search/reducers/root_reducer'
import {main_venn_connector} from './reducers/comparison_reducer'

import {comparison_tabs} from './config/comparison_tabs'
import {facetboxes, facetbox_render_order, es_links} from './config/comparison_facetboxes'
import {maintabs} from './config/comparison_tabs'

import {invalidate_comparison} from './helpers/invalidate_results'

class ComparisonPage extends React.Component {

    constructor(props) {
	super(props);
	this.store = createStore(get_root_comparison_reducer(maintabs), applyMiddleware(thunkMiddleware));
    }
    
    render() {
	var Tabs = main_tab_connector(MainTabControl);
	var SearchBoxC = main_searchbox_connector(SearchBox);
	var Venn = main_venn_connector(MainVennDiagram);
	return (<div>
		   <nav id="mainNavBar" className="navbar navbar-default navbar-inverse navbar-main">
		      <div className="container-fluid" id="navbar-main"><NavBarApp show_cartimage={true} searchbox={SearchBoxC} store={this.store} /></div>
		   </nav>
		   <div className="container" style={{width: "100%"}}>
                      <div className="row" style={{width: "100%"}}>
                         <div className="col-md-3 nopadding-right" id="facets-container">
		            <FacetApp store={this.store} pquery={GlobalParsedQuery} facetboxes={facetboxes} facetbox_render_order={facetbox_render_order} es_links={es_links}
		               invalidator={invalidate_comparison} />
                         </div>
                         <div className="col-md-9 nopadding-left" id="tabs-container">
		            <Tabs store={this.store} tabs={maintabs} />
                         </div>
                      </div>
                   </div>
		</div>);
    }
    
}
export default ComparisonPage;
