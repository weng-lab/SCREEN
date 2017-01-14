import React from 'react'
import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';

import * as Actions from '../actions/maintabs_actions';

class MainTabControl extends React.Component {
    render() {
	return (<div id="exTab1" className="container">
		   <ul className="nav nav-tabs">
		      {Object.keys(tabs).map((key) => (
		         <li className={key == selection ? "active" : ""} key={"tab_" + key}
			    style={{display: (tabs[key].visible ? "list-item" : "none") }}
	                    onClick={() => click_handler(key)}><a data-toggle="tab">{tabs[key].title}</a></li>
	              ))}
                   </ul>
		   <div className="tab-content clearfix">
		   {Object.keys(tabs).map((key) => (key != selection ? <div /> :
		  	 <div className={key == selection ? "tab-pane active" : "tab-pane"} key={"tab_" + key} id={"tab_" + id + "_" + key} key={"tcontent_" + key}>
			     {this._tab_components[key]}
			 </div>
		      ))}
		   </div>
                </div>);
    }

}

const mapStateToProps = (state) => ({
        ...state
});

const mapDispatchToProps = (dispatch) => ({
    actions: bindActionCreators(Actions, dispatch)
});

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(MainTabControl);
