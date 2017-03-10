import React from 'react'
import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';

import * as Actions from '../actions/main_actions';
import * as Render from '../../../common/renders';

import LongListFacet from '../../../common/components/longlist'
import ResultsTable from '../../../common/components/results_table'

import {CHECKLIST_MATCH_ANY} from '../../../common/components/checklist'
import {panelize} from '../../../common/utility'

const make_gwas_friendly = (gwas_study) => {
    let g = GwasGlobals.gwas.byStudy[gwas_study];
    return [g.author, g.trait].join(" / ");
}

const gwas_studies = ({gwas_study, actions}) => {
    return panelize("GWAS Studies",
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
			selection={gwas_study}
			mode={CHECKLIST_MATCH_ANY}
			pageLength={5}
			onTdClick={(c) => { actions.setStudy(c) } }
                    />, "gwasstudies");
}
const cellTypesBox = ({gwas_study, gwas_cell_types, actions}) => {
    if(!gwas_study || !gwas_cell_types){
        return (<div />);
    }
    let cts = (<ResultsTable
		   data={gwas_cell_types}
		   cols={[
                       {title: "Cell Type", data: "biosample_summary", className: "dt-right",
			width: "50%"},
                       {title: "p", data: "pval", className: "dt-right",
			render: Render.toSciNot, width: "20%"},
                       {title: "", data: "pval", visible: false},
                       {title: "FDR", data: "fdr", className: "dt-right",
			render: Render.toSciNot, width: "20%"},
                       {title: "", data: "expID", render: Render.dccLink,
			className: "dt-right dcc"},
		   ]}
		   order={[[2, "asc"], [0, "asc"]]}
		   columnDefs ={[{ "orderData": 2, "targets": 1 }]}
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
    return panelize("Cell types", cts, "gwascelltypes");
}

class FacetBoxen extends React.Component {
    doRender(p){
        return (
            <div>
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
