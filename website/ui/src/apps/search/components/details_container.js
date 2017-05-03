import React from 'react'
import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';

import * as Actions from '../actions/main_actions';
import * as Render from '../../../common/renders'

class DetailsContainer extends React.Component {
    render() {
        const makeTabTitle = (key, tab) => {
            let active = key == this.props.re_details_tab_active;
            if(!tab.enabled && !active){ return (<div />) }
	    let cn = (active ? "active" : "") + " detailsTabTitle";
            return (
		<li className={cn}
		    key={"tab_" + key}
		    onClick={ () => { this.props.actions.setReDetailTab(key) } }>
		    <a data-toggle="tab">{tab.title}</a>
		</li>);
        }

        const makeTab = (key, tab) => {
            let active = key == this.props.re_details_tab_active;
            if(!tab.enabled && !active){ return (<div />) }
            return (
		<div
                    className={active ? "tab-pane active" : "tab-pane"}
                    id={"tab_" + key}
                    key={"tpane_" + key}>
		    {React.createElement(tab.f, this.props)}
		</div>);
        }

        // TODO: avoid multiple re-renders?
        // console.log(this.props);
        let cre = this.props.active_cre;
        let accession = this.props.cre_accession_detail;
	let tabs = this.props.tabs;

        let coord = cre ? cre.chrom + ':'
			+ Render.numWithCommas(cre.start)
			+ '-' + Render.numWithCommas(cre.start + cre.len)
                  : "";

	return (
            <div className="container" style={{width: "100%"}}>
                <div className="row">
                    <div className="col-md-10">
                        <h3 className="creDetailsTitle">{accession}</h3>
			{"\u00A0"}{"\u00A0"}{"\u00A0"}
			{coord}
			{'\u00A0'}{"\u00A0"}{"\u00A0"}
			{Render.concordantStarReact(cre.concordant)}
			{'\u00A0'}{"\u00A0"}{"\u00A0"}
			{Render.creTableAccesionProxReact(cre)}
			{'\u00A0'}{"\u00A0"}{"\u00A0"}
			{Render.creTableAccesionBoxen(cre)}
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
