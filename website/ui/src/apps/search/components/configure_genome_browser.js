import React from 'react';
import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';

import * as Actions from '../actions/main_actions';

import loading from '../../../common/components/loading';
import {getCommonState} from '../../../common/utility';
import * as Render from '../../../common/renders'

class ConfigureGenomeBrowser extends React.Component {
    constructor(props) {
	super(props);
	this.key = "configgb";
        this.openGenomeBrowser = this.openGenomeBrowser.bind(this);
	this.buttonClickHandler = this.buttonClickHandler.bind(this);
    }

    componentWillReceiveProps(nextProps){
	if (self.key === nextProps.maintabs_active){
	}
    }
    
    buttonClickHandler(name, re, dispatch){
	var half_window = 7500;
	var arr = window.location.href.split("/");
	var host = arr[0] + "//" + arr[2];
	var data = JSON.stringify({"accession" : re.accession,
				   "coord_chrom" : re.chrom,
				   "coord_start" : re.start,
				   "coord_end" : re.start + re.len,
				   "halfWindow" : half_window,
				   "cellType" : this.props.cellType,
				   host,
				   GlobalAssembly});

	switch (name) {
	    case "UCSC":
                this.openGenomeBrowser(data, "/ucsc_trackhub_url"); break;
	    case "WashU":
                this.openGenomeBrowser(data, "/washu_trackhub_url"); break;
	    case "Ensembl":
                this.openGenomeBrowser(data, "/ensembl_trackhub_url"); break;
	}
    }

    openGenomeBrowser(data, url){
        $.ajax({
	    type: "POST",
	    url: url,
	    data: data,
	    dataType: "json",
	    contentType : "application/json",
	    async: false, // http://stackoverflow.com/a/20235765
	    success: (r) => {
	        if ("err" in r) {
		    $("#errMsg").text(r.err);
		    $("#errBox").show()
		    return true;
	        }
	        console.log(r.url, r.trackhubUrl);
	        window.open(r.url, '_blank');
	    },
	    error: (a, b, c) => {
	        console.log(a);
	    }
        });
    }

    render() {
        let cre = this.props.configuregb_cre;
        let coord = cre ? cre.chrom + ':'
			+ Render.numWithCommas(cre.start)
			+ '-' + Render.numWithCommas(cre.start + cre.len)
                  : "";

	return (
	    <div className="container" style={{width: "100%"}}>
		<div className="row">
                    <div className="col-md-8">
			<h3 className="creDetailsTitle">{cre.accession}</h3>
			{"         "}
			{coord}
                    </div>
		</div>
	    </div>);
    }
}

const mapStateToProps = (state) => ({ ...state });
const mapDispatchToProps = (dispatch) => ({
    actions: bindActionCreators(Actions, dispatch) });
export default connect(mapStateToProps, mapDispatchToProps)
(ConfigureGenomeBrowser);

