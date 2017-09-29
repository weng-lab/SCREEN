import React from 'react';
import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';

import LongListFacet from '../../../common/components/longlist';
import {CHECKLIST_MATCH_ANY} from '../../../common/components/checklist';

import * as Actions from '../actions/main_actions';

const make_gwas_friendly = (gwas) => (gwas_study) => {
    const g = gwas.byStudy[gwas_study];
    return [g.author, g.trait].join(" / ");
}

const render_pubmed_link = (id) => (
    <a target='_blank' href={"https://www.ncbi.nlm.nih.gov/pubmed/" + id}>{id}</a>);

class SingleStudy  extends React.Component {
    render() {
	return (
	    <LongListFacet title={""}
	    data={this.props.gwas.studies}
	    cols={[
		{ title: "Study", data: "trait"
		}, {title: "Author", data: "author",
		}, {title: "Pubmed", data: "pubmed",
		    className: "pubmed", render: render_pubmed_link}
	    ]}
	    friendlySelectionLookup={make_gwas_friendly(this.props.gwas)}
	    order={[[0, "asc"], [1, "asc"]]}
	    selection={this.props.gwas_study}
	    mode={CHECKLIST_MATCH_ANY}
	    pageLength={5}
	    onTdClick={(c, td) => {
		if (td && -1 === td.indexOf("pubmed")) {
		    this.props.actions.setStudy(c);
		}
	    }}
            />);
    }
}

class GWASstudies extends React.Component {
    render(){
	const makeTabTitle = (key, tab) => {
            let active = key === this.props.gwas_study_tab;
            if(!tab.enabled && !active){ return (<div />) }
	    let cn = (active ? "active" : "") + " gwasTabTitle";
            return (
		<li className={cn}
		    key={"tab_" + key}
		    onClick={ () => { this.props.actions.setGwasStudyTab(key) } }>
		    <a data-toggle="tab">{tab.title}</a>
		</li>);
        }

        const makeTab = (key, tab) => {
            let active = key === this.props.gwas_study_tab;
            if(!tab.enabled && !active){ return (<div />) }
            return (
		<div
                    className={active ? "tab-pane active" : "tab-pane"}
                    id={"tab_" + key}
                    key={"tpane_" + key}>
		    {React.createElement(tab.f, this.props)}
		</div>);
        }

	let tabs = {"single" : {title: "Studies",
				enabled: true, f: SingleStudy}};
	
	return (
	    <div className="container gwasStudyContainer">
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
export default connect(mapStateToProps, mapDispatchToProps)(GWASstudies);
