var React = require('react');

import {createStore, applyMiddleware} from 'redux'
import {render} from 'react-dom'
import {Provider} from 'react-redux'
import thunkMiddleware from 'redux-thunk'

import {get_root_reducer} from './reducers/root_reducer'
import FacetBoxen from './components/facetboxen'

import SearchBox from '../../common/components/searchbox'

import MainTabControl from './components/maintab'
import NavBarApp from '../../common/components/navbar_app'
import {main_tab_connector, main_searchbox_connector, default_state} from './reducers/root_reducer'
import {facetboxes, facetbox_render_order, es_links} from './config/facetboxes'
import {maintabs} from './config/maintabs'

import {invalidate_results} from './helpers/invalidate_results'

class SearchPage extends React.Component {

    constructor(props) {
	super(props);
	this.store = createStore(get_root_reducer(maintabs),
				 applyMiddleware(thunkMiddleware));
    }

    render() {
	var Tabs = main_tab_connector(MainTabControl);
	var SearchBoxC = main_searchbox_connector(SearchBox);
	return (<div>
		   <nav id="mainNavBar" className="navbar navbar-default navbar-inverse navbar-main">
		      <div className="container-fluid" id="navbar-main">
                       <NavBarApp show_cartimage={true} searchbox={SearchBoxC} store={this.store} />
                      </div>
		   </nav>
		   <div className="container" style={{width: "100%"}}>
                      <div className="row" style={{width: "100%"}}>
                         <div className="col-md-3 nopadding-right" id="facets-container">
                <FacetBoxen store={this.store} />
                         </div>
                         <div className="col-md-9 nopadding-left" id="tabs-container">
		            <Tabs store={this.store} tabs={maintabs} />
                         </div>
                      </div>
                   </div>
		</div>);
    }

}
export default SearchPage;
