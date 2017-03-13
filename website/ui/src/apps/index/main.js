import React from 'react'
import {createStore, applyMiddleware} from 'redux'
import {Provider} from 'react-redux'
import thunkMiddleware from 'redux-thunk'
import createLogger from 'redux-logger'

import MainTabs from './components/maintabs'

import reducers from './reducers'
import initialState from './config/initial_state'

class IndexPage extends React.Component {
    footer() {
	return (
	    <div id="footer">
		<center>
	    &copy; 2017 Weng Lab @ UMass Med, ENCODE Data Analysis Center
		</center>
	    </div>);
    }

    title() {
        return (
	    <div className={"container-fluid"}>
		<div className={"row"}>
                    <div className={"col-md-12"}>
			<div id={"mainTitle"}>
			    {"SCREEN: Search Candidate Regulatory Elements by ENCODE"}
			</div>
                    </div>
		</div>
            </div>);
    }

    render() {
	// const loggerMiddleware = createLogger();

	let tab = null;
	if("tab" in this.props.params){
	    tab = this.props.params.tab;
	}

	const store = createStore(reducers,
				  initialState(tab),
				  applyMiddleware(
				      thunkMiddleware,
				  ));
	
        return (
	    <Provider store={store}>
	    <div>
	    {this.title()}
	            <MainTabs
                        mainDivId={"mainTabs"}
                        tabUlClass={"nav-pills"}/>
	            {this.footer()}
	        </div>
	    </Provider>);
    }
}

export default IndexPage;
