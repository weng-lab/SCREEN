import React from 'react'
import {createStore, applyMiddleware} from 'redux'
import {Provider} from 'react-redux'
import thunkMiddleware from 'redux-thunk'
import createLogger from 'redux-logger'

import NavBarApp from '../../common/components/navbar_app'
import SearchBox from '../../common/components/searchbox'
import FacetBoxen from './components/facetboxen'
import MainTabs from './components/maintabs'

import main_reducers from './reducers/main_reducers'
import {isCart} from '../../common/utility'

import initialState from './config/initial_state'

class SearchPage extends React.Component {
    render() {
	// const loggerMiddleware = createLogger();

	let maintab = null;
        let subtab = null;
	if("maintab" in this.props.params){
	    maintab = this.props.params.maintab;
            if("subtab" in this.props.params){
                subtab = this.props.params.subtab;
            }
	}

	const store = createStore(main_reducers,
				  initialState(maintab, subtab),
				  applyMiddleware(
				      thunkMiddleware,
				      //loggerMiddleware
				  ));

	//console.log(store.getState());

	let drawMain = () => {
	    if(isCart()){
		return (
		    <div className="row" style={{width: "100%"}}>
			<div className="col-md-12" id="tabs-container">
                            <MainTabs />
			</div>
		    </div>);
	    } else {
		return (
                    <div className="row" style={{width: "100%"}}>
			<div className="col-md-3 nopadding-right" id="facets-container">
                            <FacetBoxen />
			</div>
			<div className="col-md-9 nopadding-left" id="tabs-container">
                            <MainTabs />
			</div>
		    </div>);
	    }
	}

        return (
            <Provider store={store}>
	        <div>
		    <nav id="mainNavBar"
                         className="navbar navbar-default navbar-inverse navbar-main">
		        <div className="container-fluid" id="navbar-main">
                            <NavBarApp show_cartimage={true}
                                       searchbox={SearchBox} />}/>
                        </div>
		    </nav>

		    <div className="container" style={{width: "100%"}}>
			{drawMain()}

                    </div>
		</div>
            </Provider>
        );
    }
}
export default SearchPage;
