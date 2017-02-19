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

class MiniPeaks extends React.Component {
    constructor(props) {
	super(props);
	this.state = {jq: null, isFetching: true, isError: false };
	this._colors = {
	    "dnase": "#06DA93",
	    "h3k4me3": "#FF0000",
	    "h3k27ac": "#1262EB"
	};
    }
    
    componentWillReceiveProps(nextProps){
        // only check/get data if we will become active tab...
        if("similarREs" == nextProps.re_details_tab_active){
            this.loadPeaks(nextProps);
        }
    }
    
    loadPeaks({cre_accession_detail}){
	if(cre_accession_detail in this.state){
	    return;
	}
	var q = {GlobalAssembly, accession: cre_accession_detail};
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
                this.setState({...r,
                               jq, isFetching: false, isError: false});
            }.bind(this)
        });
    }

    render() {
	let accession = this.props.cre_accession_detail;
	if (!(accession in this.state)){
	    return <div />;
	}
	var nbars = 20;
	let renderPeaks = (assay) => (allData) => {
	    if(!allData[assay]){
		return "";
	    }
	    // let fileID = dataRaw.fileID; if needed....
	    var mmax = (assay == "dnase") ? 150 : 50;
	    var mfactor = ROWHEIGHT / mmax;
	    let data = allData[assay].data.map((d) => ((d > mmax ? mmax : d) * mfactor));
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
	let renderMax = (assay) => (allData) => {
	    if (!allData[assay]){
		return "";
	    }
	    return Math.max(...allData[assay].data);
	}

	let cols = [];
	let assayToTitle = {dnase : "DNase", h3k27ac : "H3K27ac", h3k4me3 : "H3K4me3"}
	for(let acc of this.state[accession].accessions){
	    for(let assay of ["dnase", "h3k27ac", "h3k4me3"]){
		cols.push({title: assayToTitle[assay],
			   data: acc,
			   render: renderPeaks(assay)});
		cols.push({title: "signal",
			   data: acc,
			   render: renderMax(assay)});
	    }
	}
	cols = cols.concat([{title: "", data: "expID", render: Render.dccLink },
			    {title: "Tissue of origin", data: "tissue"},
			    {title: "Cell Type", data: "biosample_type"},
			    {title: "Biosample", data: "biosample_summary"}]);
		
        let table = {title: "Minipeaks",
	             cols,
		     bFilter: true,
		     dom: '<b"top"f>t<"bottom"><"clear">',
		     order: [[1, "desc"], //DNase signal
			     [7, "asc"],  // tissue
			     [9, "asc"]   // cell type
			    ]};
	
	return (<div>
                {React.createElement(ResultsTable,
                                     {data: this.state[accession].rows,
                                      ...table})}
		</div>);
    }
}

const mapStateToProps = (state) => ({ ...state });
const mapDispatchToProps = (dispatch) => ({
    actions: bindActionCreators(Actions, dispatch)
});
export default connect(mapStateToProps, mapDispatchToProps)(MiniPeaks);
