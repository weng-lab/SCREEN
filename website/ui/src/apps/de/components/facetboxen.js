import React from 'react'
import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';

import * as Actions from '../actions/main_actions';
import * as Render from '../../../common/renders';

import LongChecklistFacet from '../../../common/components/longchecklist'
import LongListFacet from '../../../common/components/longlist'
import ResultsTable from '../../../common/components/results_table'

import {CHECKLIST_MATCH_ANY} from '../../../common/components/checklist'
import {panelize} from '../../../common/utility'

const cols = [{ title: "cell type", data: "name",
		className: "dt-right" },
	      { title: "tissue", data: "tissue",
		className: "dt-right" }]

const cellTypesBox1 = ({ct1, actions}) => {
    return panelize("Cell type 1",
                    <LongListFacet
                    title={""}
                    data={Globals.cellTypeInfoArr}
                    cols={cols}
                    order={[]}
                    selection={ct1}
                    friendlySelectionLookup={(value) => {
                        return Globals.cellTypeInfo[value]["name"]; }}
                    onTdClick={(value) => { actions.setCt1(value) }}
                    />);
}

const cellTypesBox2 = ({ct2, actions}) => {
    return panelize("Cell type 2",
                    <LongListFacet
                    title={""}
                    data={Globals.cellTypeInfoArr}
                    cols={cols}
                    order={[]}
                    selection={ct2}
                    friendlySelectionLookup={(value) => {
                        return Globals.cellTypeInfo[value]["name"]; }}
                    onTdClick={(value) => { actions.setCt2(value) }}
                    />);
}

const creBox = ({cres, ct1, ct2, actions}) => {
    if(!cres || !ct1 || !ct2){
        return (<div />);
    }
    let cts = (<ResultsTable
               data={cres}
               cols={[
                   {title: "accession", data: "accession",
                    render: Render.relink(GlobalAssembly),
                    className: "dt-right"},
                   {title: "start", data: "start", render: Render.integer,
                    className: "dt-right"},
                   {title: "length", data: "len", render: Render.integer,
                    className: "dt-right"},
                   {title: "Z change", data: "value",
                    className: "dt-right"}
               ]}
               order={[[3, "desc"], [1, "asc"]]}
               />);
    return panelize("Candidate Regulatory Elements", cts);
}

const genesBox = ({genes, ct1, ct2, actions}) => {
    if(!genes || !ct1 || !ct2){
        return (<div />);
    }
    let cts = (<ResultsTable
               data={genes}
               cols={[
                   {title: "accession", data: "accession",
                    render: Render.relink(GlobalAssembly),
                    className: "dt-right"},
                   {title: "start", data: "start", render: Render.integer,
                    className: "dt-right"},
                   {title: "length", data: "len", render: Render.integer,
                    className: "dt-right"},
                   {title: "Z change", data: "value",
                    className: "dt-right"}
               ]}
               order={[[3, "desc"], [1, "asc"]]}
               />);
    return panelize("Candidate Regulatory Elements", cts);
}

class FacetBoxen extends React.Component {
    doRender(p){
        return (<div>
                {cellTypesBox1(p)}
                {cellTypesBox2(p)}
                {creBox(p)}
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
