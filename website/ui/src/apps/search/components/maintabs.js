import React from 'react'
import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';

import * as Actions from '../actions/facetboxen_actions';

const resultsTab  = ({accessions, actions}) => {
    return (<div>
            results
            </div>);
}

const treeTab  = ({accessions, actions}) => {
    return (<div>
            tree
            </div>);
}

const detailsTab = ({accessions, actions}) => {
    return (<div>
            details
            </div>);
}

const gcompareTab = ({accessions, actions}) => {
    return (<div>
            gcompare
            </div>);
}

const MainTabs = (props) => {
    let tabs = { results : {title: "Search results", visible: true,
                            f: resultsTab},
                 ct_tree: {title: "Cell Type Clustering", visible: true,
                           f: treeTab},
	         details: {title: "RE Details", visible: false,
                           f: detailsTab},
	         gcompare: {title: "Group comparison", visible: false,
                            f: gcompareTab} };

    let maintabs_active = props.maintabs_active;
    console.log(maintabs_active);

    const makeTabTitle = (key, tab) => {
        let active = key == maintabs_active;
	return (<li className={active ? "active" : ""}
                    key={"tab_" + key}
	            style={{display: (tab.visible ? "list-item" : "none") }}
	        onClick={ () => { props.actions.setMainTab(key) } }>
                <a data-toggle="tab">{tab.title}</a>
                </li>);
    }

    const makeTab = (key, tab) => {
        let active = key == maintabs_active;
        if(!active){
            return (<div />);
        }
        return (<div
                className={active ? "tab-pane active" : "tab-pane"}
                key={"tab_" + key}
                id={"tab_main_" + key}
                key={"tcontent_" + key}>
		{tab.f(props)}
		</div>
        )
    }

    return (<div id="exTab1" className="container">

	    <ul className="nav nav-tabs">
	    {Object.keys(tabs).map((key) => ( makeTabTitle(key, tabs[key]) ))}
            </ul>

	    <div className="tab-content clearfix">
	    {Object.keys(tabs).map((key) => ( makeTab(key, tabs[key]) ))}
	    </div>

            </div>);
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
)(MainTabs);
