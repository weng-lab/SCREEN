import React from 'react'
import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';

import ReactDOMServer from 'react-dom/server'

import * as Actions from '../actions/main_actions';
import * as Render from '../../../common/renders'

import ResultsTable from '../../../common/components/results_table'
import loading from '../../../common/components/loading'

import {TissueColors, primary_cell_color, tissue_color, friendly_celltype, tissue_name, infer_primary_type} from '../config/colors'

const ROWHEIGHT = 30.0;
const ROWMARGIN = 15;
const COLMARGIN = 10;
const LEFTMARGIN = 450;
const TOPMARGIN = 100;
const TOPANGLED = 60.0;
const TOPANGLE = TOPANGLED * Math.PI / 180.0;

const _tissuecolor = (t) => (TissueColors[t] ? TissueColors[t] : "#000000");

const ctindex = (d) => {
    var t = tissue_name(d);
    if (d.includes("primary_cell")) {
	t = infer_primary_type(d, tissue_name(d));
	return 1000 + t.charCodeAt(0) + t.charCodeAt(1) + t.charCodeAt(2);
    } else if (d.includes("tissue")) {
	return 2000 + d.charCodeAt(0) + d.charCodeAt(1) + d.charCodeAt(2);
    }
    return 3000 + d.charCodeAt(0) + d.charCodeAt(1) + d.charCodeAt(2);
}

class MiniPeaks extends React.Component {
    constructor(props) {
	super(props);
	this.state = {assay: "dnase", jq: null,
		      isFetching: true, isError: false };
	this.onAssaySelect = this.onAssaySelect.bind(this);
	this._colors = {
	    "dnase": "#06DA93",
	    "h3k4me3": "#FF0000",
	    "h3k27ac": "#1262EB"
	};
    }
    
    componentWillReceiveProps(nextProps){
        // only check/get data if we will become active tab...
        if("similarREs" == nextProps.re_details_tab_active){
            this.loadPeaks(nextProps, this.state.assay);
        }
    }
    
    loadPeaks({cre_accession_detail}, assay){
	if(assay in this.state){
	    this.setState({assay});
	    return;
	}
	var q = {GlobalAssembly, accession: cre_accession_detail, assay};
        var jq = JSON.stringify(q);
        if(this.state.jq == jq){
            // http://www.mattzeunert.com/2016/01/28/javascript-deep-equal.html
            return;
        }
        //console.log("loadCREs....", this.state.jq, jq);
        this.setState({jq, isFetching: true});
        $.ajax({
            url: "/dataws/re_detail/similarREs",
            type: "POST",
	    data: jq,
	    dataType: "json",
	    contentType: "application/json",
            error: function(jqxhr, status, error) {
                console.log("err loading cres for table");
                this.setState({jq: null, isFetching: false, isError: true});
            }.bind(this),
            success: function(r) {
                this.setState({assay, ...r,
                               jq, isFetching: false, isError: false});
            }.bind(this)
        });
    }
    
    onAssaySelect() {
	this.loadPeaks(this.props, this.refs.assay.value);
    }

    render() {
	var assay = this.state.assay;
	if(!(assay in this.state)){
	    return loading({...this.state});
	}

	var mp = this.state[assay].mpeaks;
	var accessions = this.state[assay].accessions;
	var nbars = 20;
	var mmax = (assay == "dnase") ? 150 : 50;
	var mfactor = ROWHEIGHT / mmax;

	const renderPeaks = (dataRaw) => {
	    let data = dataRaw.map((d) => ((d > mmax ? mmax : d) * mfactor));
	    let color = this._colors[assay];
	    let e = (<svg width={data.length} height={ROWHEIGHT} >
		     <g>
		     {data.map((v, i) => (<rect width="1" height={v}
					  y={ROWHEIGHT - v} x={i}
					  fill={color} />))}
		     </g>
		     </svg>);
	    return ReactDOMServer.renderToStaticMarkup(e);
	}

        let table = {title: assay + " Minipeaks",
	             cols: [
			 {title: accessions[0], data: accessions[0],
			  render: renderPeaks},
			 {title: "max", data: accessions[0] + "avg"},
			 {title: "", data: "expID",
	                  render: Render.dccLink },
			 {title: "Tissue of origin", data: "tissue"},
			 {title: "Cell Type", data: "biosample_type"},
			 {title: "Biosample", data: "biosample_summary"},
		     ],
		     bFilter: true,
		     order: [[1, "desc"], [5, "asc"]]
                    };

	let dtable = (<div>
	              <h4>{assay}</h4>
                      {React.createElement(ResultsTable,
                                           {data: mp,
                                            ...table})}
		      </div>);
	
	const isSel = (a) => (a == assay);
	
	return (<div>
		<select ref="assay" onChange={this.onAssaySelect}>
		<option value="dnase" selected={isSel("dnase")}>DNase</option>
		<option value="h3k4me3" selected={isSel("h3k4me3")}>H3K4me3</option>
		<option value="h3k27ac" selected={isSel("h3k27ac")}>H3K27ac</option>
		</select><br />

		{dtable}
		
		</div>);
    }
}

const mapStateToProps = (state) => ({ ...state });
const mapDispatchToProps = (dispatch) => ({
    actions: bindActionCreators(Actions, dispatch)
});
export default connect(mapStateToProps, mapDispatchToProps)(MiniPeaks);
