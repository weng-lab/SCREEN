import React from 'react'
import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';

import LongListFacet from '../../../common/components/longlist'
import {CHECKLIST_MATCH_ANY} from '../../../common/components/checklist'

import * as Actions from '../actions/main_actions';
import * as Render from '../../../common/renders';

const make_gwas_friendly = (gwas_study) => {
    let g = GwasGlobals.gwas.byStudy[gwas_study];
    return [g.author, g.trait].join(" / ");
}

class GWASstudies extends React.Component {
    render(){
	return (
	    <LongListFacet
		title={""}
		data={GwasGlobals.gwas.studies}
		cols={[
		    {title: "Study", data: "trait",
		     className: "dt-right"},
		    {title: "Author", data: "author",
                     className: "dt-right"},
		    {title: "Pubmed", data: "pubmed",
                     className: "dt-right"}
		]}
		friendlySelectionLookup={make_gwas_friendly}
		order={[[0, "asc"], [1, "asc"]]}
		selection={this.props.gwas_study}
		mode={CHECKLIST_MATCH_ANY}
		pageLength={5}
		onTdClick={(c) => { this.props.actions.setStudy(c) } }
            />);
    }
}

const mapStateToProps = (state) => ({ ...state });
const mapDispatchToProps = (dispatch) => ({
    actions: bindActionCreators(Actions, dispatch)
});
export default connect(mapStateToProps, mapDispatchToProps)(GWASstudies);
