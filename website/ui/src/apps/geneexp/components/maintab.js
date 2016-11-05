import React from 'react';
import {connect} from 'react-redux';

import {SELECT_TAB} from '../reducers/tab_reducer'

class MainTabControl extends React.Component {

    constructor(props) {
	super(props);
	this._click_handler = this._click_handler.bind(this);
	this._tab_components = {};
	for (var key in props.tabs) {
	    this._tab_components[key] = props.tabs[key].render(props.store, key);
	}
    }

    _click_handler(k) {
	if (this.props.onClick) {
	    this.props.onClick(k);
	}
    }

    render() {
	var tabs = this.props.tabs;
	var selection = this.props.selection;
	var id = this.props.id;
	var store = this.props.store;
	var click_handler = this._click_handler;
	return (<div id="exTab1" className="container">
		   <ul className="nav nav-tabs">
		      {Object.keys(tabs).map((key) => (
		         <li className={key == selection ? "active" : ""} key={"tab_" + key}
			    style={{display: (tabs[key].visible ? "list-item" : "none") }}
	                    onClick={() => click_handler(key)}><a data-toggle="tab">{tabs[key].title}</a></li>
	              ))}
                   </ul>
		   <div className="tab-content clearfix">
		      {Object.keys(tabs).map((key) => (
		  	 <div className={key == selection ? "tab-pane active" : "tab-pane"} key={"tab_" + key} id={"tab_" + id + "_" + key} key={"tcontent_" + key}>
			     {this._tab_components[key]}
			 </div>
		      ))}
		   </div>
                </div>);
    }
    
}
export default MainTabControl;

const props_map = (f) => (_state) => {
    var state = f(_state);
    return {
	tabs: state.tabs,
	selection: state.selection,
	id: state.id
    }
};

const dispatch_map = (f) => (_dispatch) => {
    var dispatch = f(_dispatch);
    return {
	onClick: (k) => {dispatch({
	    type: SELECT_TAB,
	    selection: k
	})}
    };
};

export const MainTabsConnector = (pf, df) => connect(props_map(pf), dispatch_map(df));
