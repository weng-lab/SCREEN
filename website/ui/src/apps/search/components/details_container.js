import React from 'react'

import ResultsTable from '../../../common/components/results_table'
import BarGraphTable from '../components/bar_graph_table'

import * as Actions from '../actions/main_actions';

class DetailsContainer extends React.Component {
    render() {
        const makeTabTitle = (key, tab) => {
            if(!tab.enabled){ return (<div />) }
            let active = key == this.props.re_details_tab_active;
            return (<li className={active ? "active" : ""}
                    key={"tab_" + key}
                    onClick={ () => { this.props.actions.setReDetailTab(key) } }>
		    <a data-toggle="tab">{tab.title}</a>
		    </li>);
        }

        const makeTab = (key, tab) => {
            if(!tab.enabled){ return (<div />) }
            let active = key == this.props.re_details_tab_active;
            /* var content = (tab.render ? tab.render(store, k) : tabEles(tab.tables, tab.numCols));*/
            return (<div
                    className={active ? "tab-pane active" : "tab-pane"}
                    id={"tab_" + key}
                    key={"tpane_" + key}>
		    {React.createElement(tab.f, this.props)}
		    </div>);
        }

        var accession = this.props.cre_accession_detail;
	var tabs = this.props.tabs;

	return (<div className="container" style={{width: "100%"}}>
		<h3>{accession}</h3>

                <ul className="nav nav-tabs">
  		{Object.keys(tabs).map((key) => ( makeTabTitle(key, tabs[key] )))}
                </ul>

		<div className="tab-content clearfix">
		{Object.keys(tabs).map((key) => ( makeTab(key, tabs[key]) ))}
		</div>

                </div>);
    }
}

export default DetailsContainer;