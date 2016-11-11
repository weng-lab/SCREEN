import React from 'react';

import {createStore, applyMiddleware} from 'redux'
import {render} from 'react-dom'
import {Provider} from 'react-redux'
import thunkMiddleware from 'redux-thunk'

import {invalidate_results} from './helpers/invalidate_results'
import {RootReducer} from './reducers/root_reducer'
import FacetApp from './components/facet_app'

import NavBarApp from '../../common/components/navbar_app'
import MainTabControl from './components/maintab'
import {main_tab_connector} from './reducers/root_reducer'
import {invalidate_boxplot} from './helpers/invalidate_results'

class GeneExpPage extends React.Component {

    constructor(props) {
	super(props);
	this.store = createStore(RootReducer, applyMiddleware(thunkMiddleware));
	this.store.geneID = this.props.params.geneID
    }

    componentDidMount() {
	this.store.dispatch(invalidate_boxplot({"geneID" : this.store.geneID}))
    }    

    render() {
	var Tabs = main_tab_connector(MainTabControl);
	return (<div>
		   <nav id="mainNavBar" className="navbar navbar-default navbar-inverse">
		      <div className="container-fluid" id="navbar-main"><NavBarApp show_cartimage={false} show_searchbox={true} store={this.store} /></div>
		   </nav>
		   <div className="container" style={{width: "100%"}}>
                      <div className="row" style={{width: "100%"}}>
                         <div className="col-md-3 nopadding-right" id="facets-container">
		            <FacetApp store={this.store} pquery={GlobalParsedQuery} />
                         </div>
                         <div className="col-md-9 nopadding-left" id="tabs-container">
		            <Tabs store={this.store} />
                         </div>
                      </div>
                   </div>
		</div>);
    }
}

export default GeneExpPage;
