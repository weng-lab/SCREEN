import React from 'react'
import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';

import * as Actions from '../actions/main_actions';
import * as Render from '../../../common/renders'

import loading from '../../../common/components/loading'
import ResultsTable from '../../../common/components/results_table'
import HelpIcon, {HelpTooltip} from '../../../common/components/help_icon'

class CelltypeView extends React.Component {
    constructor(props) {
        super(props);
        this.state = { jq: null, isFetching: true, isError: false};
        this.loadCres = this.loadCres.bind(this);
	this.button_click_handler = this.button_click_handler.bind(this);
    }

    button_click_handler(name, rowdata, actions){
	let cre = {...rowdata, ...rowdata.info, len: rowdata.stop - rowdata.start};
	actions.showGenomeBrowser(cre, name);
    }
    
    componentDidMount(){
        this.loadCres(this.props);
    }

    componentWillReceiveProps(nextProps){
        //console.log("componentWillReceiveProps", nextProps);
        this.loadCres(nextProps);
    }

    componentWillUnmount(){
        // else next study will reuse celltype
        this.props.actions.setCellType(null);
    }

    loadCres({gwas_study, cellType, actions}){
        if(cellType.cellTypeName in this.state){
            return;
        }
        var q = {GlobalAssembly, gwas_study,
                 "cellType" : cellType.cellTypeName };
        var jq = JSON.stringify(q);
        if(this.state.jq == jq){
            // http://www.mattzeunert.com/2016/01/28/javascript-deep-equal.html
            return;
        }
        //console.log("loadGene....", this.state.jq, jq);
        this.setState({jq, isFetching: true});
        $.ajax({
            url: "/gwasJson/cres",
            type: "POST",
	    data: jq,
	    dataType: "json",
	    contentType: "application/json",
            error: function(jqxhr, status, error) {
                console.log("err loading cres for table");
                this.setState({isFetching: false, isError: true});
            }.bind(this),
            success: function(r) {
                this.setState({...r, isFetching: false, isError: false});
            }.bind(this)
        });
    }

    render() {
        if(!(this.props.cellType.cellTypeName in this.state)){
            return loading(this.state);
        }
        let data = this.state[this.props.cellType.cellTypeName];
        let cres = data.accessions;
        let vcols = data.vcols;

	let klassCenter = "dt-body-center dt-head-center ";
	let ctsHelp = "SCT<br />" +
	    HelpTooltip("CellTypeSpecifiedClassification");
        let cols = [
            {title: "accession", data: "info", className: klassCenter,
             render: Render.creTableAccession },
	    {title: "CTS", data: "ctspecifc", visible: true, name: "cts", render: Render.creTableCellTypeSpecific},
	    {title: "H3K4me3 Z", data: "promoter zscore", render: Render.real,
	     className: klassCenter, visible: vcols["promoter zscore"]},
            {title: "H3K27ac Z", data: "enhancer zscore", render: Render.real,
             className: klassCenter, visible: vcols["enhancer zscore"]},
            {title: "DNase Z", data: "dnase zscore",
             className: klassCenter, visible: vcols["dnase zscore"]},
            {title: "SNPs", data: "snps", className: klassCenter,
	     render: Render.snpLinks},
            {title: "gene", data: "geneid", className: klassCenter, render: Render.gene_link},
	    {
		title: "genome browsers", data: null,
		className: klassCenter + "browser",
		targets: -1,
		orderable: false,
		defaultContent: Render.browser_buttons(["UCSC"])
		//, "Ensembl"
	     }
        ];

	let columnDefs = [{ "orderData": 2, "targets": 1 }];
	let actions = this.props.actions;
	
        let creTable = (<ResultsTable
			    onButtonClick={(td, rowdata) =>
					   this.button_click_handler(td, rowdata, actions)}
                            data={cres}
			    columnDefs={columnDefs}
                            cols={cols}
                            bFilter={true}
		            cvisible={vcols}
                            order={[[2, "desc"], [0, "asc"]]}
                        />);
	let pct = Math.round(100.0 * cres.length / +this.props.rdata.numCresOverlap);
	return (
            <div>
                <h3 style={{display: "inline"}}>
                    {this.props.cellType.biosample_summary}
                    <HelpIcon helpkey={"GWAS_Results_Table"} />
                </h3>{" "}
		<em>{cres.length} / {this.props.rdata.numCresOverlap} cREs ({pct}%) active in this cell type</em><br /><br />
                {creTable}
	    </div>);
    }
}

const mapStateToProps = (state) => ({ ...state });
const mapDispatchToProps = (dispatch) => ({
    actions: bindActionCreators(Actions, dispatch)
});
export default connect(mapStateToProps, mapDispatchToProps)(CelltypeView);
