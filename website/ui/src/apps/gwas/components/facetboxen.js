import React from 'react'
import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';

import * as Actions from '../actions/main_actions';
import * as Render from '../../../common/renders';

import LongListFacet from '../../../common/components/longlist'
import ResultsTable from '../../../common/components/results_table'

import {CHECKLIST_MATCH_ANY} from '../../../common/components/checklist'
import {panelize} from '../../../common/utility'

const gwas_studies = ({gwas_study, actions}) => {
    return panelize("GWAS Studies",
                    <LongListFacet
                    title={""}
                    data={GwasGlobals.gwas.studies}
                    cols={[
                        {title: "Study", data: "trait", className: "dt-right"},
                        {title: "Author", data: "author", className: "dt-right"},
                        {title: "Pubmed", data: "pubmed", className: "dt-right"}
	                ]}
                    order={[[0, "asc"], [1, "asc"]]}
		    selection={gwas_study}
        	    mode={CHECKLIST_MATCH_ANY}
                    pageLength={5}
                    onTdClick={(c) => { actions.setStudy(c) } }
                    />);
}

const cellTypesBox = ({gwas_study, gwas_cell_types, actions}) => {
    if(!gwas_study || !gwas_cell_types){
        return (<div />);
    }
    let cts = (<ResultsTable
               data={gwas_cell_types}
               cols={[
                   {title: "Cell Type", data: "biosample_summary",
                    className: "dt-right"},
                   {title: "-log(fdr)", data: "neglogfdr",
                    className: "dt-right"},
                   {title: "", data: "expID", render: Render.dccLink,
                    className: "dt-right dcc"},
	       ]}
               order={[[1, "desc"], [0, "asc"]]}
               bFilter={true}
               onTdClick={(td, data) => {
                   if(td){
                       if (td.className.indexOf("dcc") == -1) {
                           actions.setCellType(data);
                       }
                   } else {
                       actions.setCellType(data);
                   };
               }}
               />);
    return panelize("Cell types", cts);
}

class FacetBoxen extends React.Component {
    doRender(p){
        return (<div>
                {gwas_studies(p)}
                {cellTypesBox(p)}
                </div>);
    }

    render() {
        return this.doRender(this.props)
    }
}

const mapStateToProps = (state) => ({ ...state });
const mapDispatchToProps = (dispatch) => ({
    actions: bindActionCreators(Actions, dispatch)
});
export default connect(mapStateToProps, mapDispatchToProps)(FacetBoxen);
