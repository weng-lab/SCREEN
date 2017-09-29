import React from 'react';
import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';

import GWASstudies from './gwas_studies';

import * as Actions from '../actions/main_actions';
import * as Render from '../../../common/zrenders';

import Ztable from '../../../common/components/ztable/ztable';

import {panelize} from '../../../common/utility';

const gwas_studies = ({globals, gwas_study}) => {
    let box = (
	<GWASstudies
	    gwas_study={gwas_study}
	/>);
    return panelize("GWAS Studies", box, "GWAS_Studies_Facet", globals);
}
const cellTypesBox = ({globals, gwas_study, gwas_cell_types, actions}) => {
    if(!gwas_study || !gwas_cell_types){
        return (<div />);
    }
    let box = (
	<Ztable
	    data={gwas_cell_types}
	    cols={[
                {title: "Cell Type", data: "biosample_summary",
		 width: "50%"},
                {title: "p", data: "pval", 
		 render: Render.toSciNot, width: "20%"},
                {title: "", data: "pval", visible: false},
                {title: "FDR", data: "fdr", 
		 render: Render.toSciNot, width: "20%"},
		{title: "", data: "cellTypeName", className: "dcc",
		 render: Render.assayIcon, orderable: false},
                {title: "", data: "expID", render: Render.dccLink, visible: false,
		 className: "dcc"},
	    ]}
	    order={[[2, "asc"], [0, "asc"]]}
	    columnDefs ={[{ "orderData": 2, "targets": 1 }]}
	    bFilter={true}
	    onTdClick={(td, data) => {
		    if(td && -1 === td.indexOf("dcc")) {
			actions.setCellType(data);
		    } else {
			actions.setCellType(data);
		    };
		}}
        />);
    return panelize("Cell types", box, "GWAS_Cell_Types_Facet", globals);
}

class FacetBoxen extends React.Component {
    render() {
        return (
            <div>
		{gwas_studies(this.props)}
		{cellTypesBox(this.props)}
            </div>);
    }
}

const mapStateToProps = (state) => ({ ...state });
const mapDispatchToProps = (dispatch) => ({
    actions: bindActionCreators(Actions, dispatch)
});
export default connect(mapStateToProps, mapDispatchToProps)(FacetBoxen);
