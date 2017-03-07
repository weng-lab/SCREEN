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
			data={Globals.cellTypeInfoArr.filter((x) => (x.isde))}
			cols={cols}
			order={[]}
			selection={ct1}
			friendlySelectionLookup={(value) => {
				return Globals.byCellType[value][0]["name"]; }}
			onTdClick={(value) => { actions.setCt1(value) }}
                    />);
}

const cellTypesBox2 = ({ct2, actions}) => {
    return panelize("Cell type 2",
                    <LongListFacet
			title={""}
			data={Globals.cellTypeInfoArr.filter((x) => (x.isde))}
			cols={cols}
			order={[]}
			selection={ct2}
			friendlySelectionLookup={(value) => {
				return Globals.byCellType[value][0]["name"]; }}
			onTdClick={(value) => { actions.setCt2(value) }}
                    />);
}

const creBox = ({des, ct1, ct2, actions}) => {
    if(!des || !ct1 || !ct2){
        return (<div />);
    }
    let cres = des.diffCREs.data;
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
                   pageLength={5}
	           bFilter={true}
                   order={[[3, "desc"], [1, "asc"]]}
               />);
    return panelize("Candidate Regulatory Elements", cts);
}

const geneBox = ({des, ct1, ct2, actions}) => {
    if(!des || !ct1 || !ct2){
        return (<div />);
    }
    let genes = des.nearbyDEs.data;
    let cts = (<ResultsTable
                   data={genes}
                   cols={[
                       {title: "gene", data: "gene",
                        className: "dt-right"},
                       {title: "start", data: "start", render: Render.integer,
                        className: "dt-right"},
                       {title: "strand", data: "strand",
                        className: "dt-right"},
                       {title: "fold change", data: "fc", render: Render.real,
                        className: "dt-right"}
                   ]}
                   pageLength={5}
	           bFilter={true}
                   order={[[3, "desc"]]}
               />);
    return panelize("Differentially Expressed Genes", cts);
}

class FacetBoxen extends React.Component {
    doRender(p){
	const geneRed = "#FF0000";
	const geneBlue = "#1E90FF";

        let legend = (<div>
                      <p style={{color: geneRed}}>
                      {"Watson (+) strand"}
                      </p>
                      <p style={{color: geneBlue}}>
                      {"Crick (-) strand"}
                      </p>
                      </div>);

        return (<div>
                {cellTypesBox1(p)}
                {cellTypesBox2(p)}
                {creBox(p)}
                {geneBox(p)}
		{legend}
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
