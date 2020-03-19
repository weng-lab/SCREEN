/*
 * SPDX-License-Identifier: MIT
 * Copyright (c) 2016-2020 Michael Purcaro, Henry Pratt, Zhiping Weng
 */

import React from 'react';
import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';

import * as Actions from '../actions/main_actions';
import * as Render from '../../../common/zrenders';

class DetailsContainer extends React.Component {
    render() {
        const makeTabTitle = (key, tab) => {
            let active = key === this.props.re_details_tab_active;
            if(!tab.enabled && !active){
		return (<div key={key} />)
	    }
	    let cn = (active ? "active" : "") + " detailsTabTitle";
            return (
		<li className={cn}
		    key={"tab_" + key}
		    onClick={ () => { this.props.actions.setReDetailTab(key) } }>
		    <a data-toggle="tab">{tab.title}</a>
		</li>);
        }

        const makeTab = (key, tab) => {
            let active = key === this.props.re_details_tab_active;
            if(!tab.enabled && !active){
		return (<div key={key} />)
	    }
            return (
		<div
                    className={active ? "tab-pane active" : "tab-pane"}
                    id={"tab_" + key}
                    key={"tpane_" + key}>
		    {React.createElement(tab.f, this.props)}
		</div>);
        }

	let tabs = this.props.tabs;

        // TODO: avoid multiple re-renders?
        // console.log(this.props);
        let cre = this.props.active_cre;
	
	return (
            <div className="container" style={{width: "100%"}}>
                <div className="row">
                    <div className="col-md-10">
			{Render.creTitle(this.props.globals, cre)}
                    </div>
                </div>

                <ul className="nav nav-tabs">
  		    {Object.keys(tabs).map((key) => (
                         makeTabTitle(key, tabs[key] )))}
                </ul>

		<div className="tab-content clearfix">
		    {Object.keys(tabs).map((key) => (
                         makeTab(key, tabs[key]) ))}
		</div>
            </div>);
    }
}


const mapStateToProps = (state) => ({ ...state });
const mapDispatchToProps = (dispatch) => ({
    actions: bindActionCreators(Actions, dispatch)
});
export default connect(mapStateToProps, mapDispatchToProps)(DetailsContainer);
