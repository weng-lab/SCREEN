import React from 'react';
import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';

import * as ApiClient from '../../../common/api_client';
import * as Actions from '../actions/main_actions';
import * as Render from '../../../common/zrenders';

import Ztable from '../../../common/components/ztable/ztable';
import loading from '../../../common/components/loading';

const ROWHEIGHT = 30.0;

class MiniPeaks extends React.Component {
    constructor(props) {
	super(props);
	this.state = {jq: null, isFetching: true, isError: false };
        this.key = "similarREs";
	this._colors = {
	    "dnase": "#06DA93",
	    "h3k4me3": "#FF0000",
	    "h3k27ac": "#FFCD00"
	};
    }

    shouldComponentUpdate(nextProps, nextState) {
	if("details" === nextProps.maintabs_active){
            if(this.key === nextProps.re_details_tab_active){
		return true;
	    }
	}
	return false;
    }

    componentWillReceiveProps(nextProps){
        // only check/get data if we will become active tab...
	if("details" === nextProps.maintabs_active){
            if(this.key === nextProps.re_details_tab_active){
                this.loadPeaks(nextProps);
            }
        }
    }

    loadPeaks({assembly, cre_accession_detail}){
	if(cre_accession_detail in this.state){
	    return;
	}
	var q = {assembly, accession: cre_accession_detail};
        var jq = JSON.stringify(q);
        if(this.state.jq === jq){
            // http://www.mattzeunert.com/2016/01/28/javascript-deep-equal.html
            return;
        }
        this.setState({jq, isFetching: true});
	ApiClient.getMinipeaks(jq, 
			       (r) => {
				   this.setState({...r,
					       jq, isFetching: false, isError: false});
			    },
			    (msg) => {
				console.log("err loading minipeaks");
				this.setState({jq: null, isFetching: false, isError: true});
			    });
    }
    
    doRender(accession){
	let renderPeaks = (assay) => (allData) => {
	    if(!allData[assay]){
		return "";
	    }
	    // let fileID = dataRaw.fileID; if needed....
	    var mmax = (assay === "dnase") ? 150 : 50;
	    var mfactor = ROWHEIGHT / mmax;
	    let data = allData[assay].data.map((d) => ((d > mmax ? mmax : d) * mfactor));
	    let color = this._colors[assay];
	    let e = (
                <span className={"text-nowrap"}>
                    <svg width={data.length} height={ROWHEIGHT} >
	                <g>
		            {data.map((v, i) => (<rect width="1" height={v}
						 key={i}
					               y={ROWHEIGHT - v} x={i}
					               fill={color} />))}
		        </g>
		    </svg>
		    {" "}{Math.max(...allData[assay].data).toFixed(1)}
		</span>);
	    return e;
	}
	let renderMax = (assay) => (allData) => {
	    if (!allData[assay]){
		return "";
	    }
	    return Math.max(...allData[assay].data);
	}

	let cols = [];
	let assayToTitle = {dnase : "DNase", h3k27ac : "H3K27ac",
			    h3k4me3 : "H3K4me3"}
	for(let acc of this.state[accession].accessions){
	    for(let assay of ["dnase", "h3k27ac", "h3k4me3"]){
		cols.push({title: assayToTitle[assay], 
			   data: acc,
			   //sortDataF: (d) => (renderMax(assay)(d)),
			   orderable: false,
			   className: "dt-right minipeak",
			   render: renderPeaks(assay)});
	    }
	}
	cols = cols.concat([{title: "", data: "expIDs",
			     render: Render.dccLinkCtGroupExpIDs},
			    {title: "Tissue of origin", data: "tissue"},
			    {title: "Cell Type", data: "biosample_type"},
			    {title: "Biosample", data: "biosample_summary"}]);

        let table = {title: "Minipeaks",
	             cols,
		     bFilter: true,
		     //sortCol: ["dnase", false]
		    };
        return React.createElement(Ztable,
                                   {data: this.state[accession].rows,
                                    ...table});
    }

    render() {
	let accession = this.props.cre_accession_detail;
	if (!(accession in this.state)){
            return loading(this.state);
	}

	return (
            <div className={"minipeaks"}>
                {this.doRender(accession)}
	    </div>);
    }
}

const mapStateToProps = (state) => ({ ...state });
const mapDispatchToProps = (dispatch) => ({
    actions: bindActionCreators(Actions, dispatch)
});
export default connect(mapStateToProps, mapDispatchToProps)(MiniPeaks);
