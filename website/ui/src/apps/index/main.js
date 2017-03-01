import React from 'react'
import {createStore, applyMiddleware} from 'redux'
import {Provider} from 'react-redux'
import thunkMiddleware from 'redux-thunk'
import createLogger from 'redux-logger'

import MainTabs from './components/maintabs'

import reducers from './reducers'
import initialState from './config/initial_state'

class IndexPage extends React.Component {
    tabTitle(href, title, cn){
	return (
	    <li className={cn}>
		<a  href={"#" + href} data-toggle={"tab"}>{title}</a>
	    </li>);
    }

    tabContent(href, content, cn){
	return (
	    <div className={"tab-pane " + cn} id={href}>
		{tabPanelize(content)}
	    </div>);
    }

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

    tabs(){
	return (
	    <div id="mainTabs" className="container">
		<ul className="nav nav-pills">
		    {this.tabTitle("main", "Overview", "active")}
		    {this.tabTitle("about", "About", "")}
		    {this.tabTitle("tut", "Tutorial", "")}
		</ul>

		<div className="tab-content clearfix">
		    {this.tabContent("main", <TabMain />, "active")}
		    {this.tabContent("about", TabAbout(), "")}
		    {this.tabContent("tut", TabTutorial(), "")}
		</div>
	    </div>);
    }

    render() {
	const loggerMiddleware = createLogger();

	const store = createStore(reducers,
				  initialState(),
				  applyMiddleware(
				      thunkMiddleware,
				  ));

        return (
	    <Provider store={store}>
		<div>
		    {this.title()}
		    {this.tabs()}
		    {this.footer()}
		</div>
	    </Provider>);
    }
}

export default IndexPage;
