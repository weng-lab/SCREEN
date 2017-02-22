import React from 'react'
import {render} from 'react-dom'
import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';

import * as Actions from './main_actions';

class TabMain extends React.Component {
    constructor(props) {
	super(props);
	this.userQueries = {}; // cache autocomplete
        this.state = { userErrMsg : null };
	this.loadSearch = this.loadSearch.bind(this);
	this.searchHg19 = this.searchHg19.bind(this);
	this.searchMm10 = this.searchMm10.bind(this);
    }

    loadSearch(assembly, userQuery){
	let jq = JSON.stringify({assembly, userQuery});
	$.ajax({
	    url: "/autows/search",
	    type: "POST",
	    data: jq,
	    dataType: "json",
	    contentType : "application/json",
	    error: function(jqxhr, status, error) {
		this.setState({userErrMsg : "err during load"});
	    }.bind(this),
	    success: function(r){
		if(r.failed){
		    console.log("userErrMsg", r);
		    this.setState({userErrMsg : r.userErrMsg})
		} else {
		    let params = jQuery.param({q: userQuery, assembly});
		    let url = "/search/?" + params;
		    window.location.href = url;
		}		
	    }.bind(this)
	});
    }

    searchHg19() {
	let userQuery = this.refs.searchBox.value;
	this.loadSearch("hg19", userQuery);
    }
    
    searchMm10() {
	let userQuery = this.refs.searchBox.value;
	this.loadSearch("mm10", userQuery);
    }
    
    textBox() {
	return (<div>
		{"SCREEN is a web interface for searching and visualizing the Registry of candidate Regulatory Elements (cREs) derived from "}
		<a href={"https://encodeproject.org/"} target={"_blank"}>ENCODE data</a>
		{". The Registry contains 2.67M human cREs in hg19 and 1.67M mouse cREs in mm10, with orthologous cREs cross-referenced.  SCREEN presents the data that support biochemical activities of the cREs and the expression of nearby genes in specific cell and tissue types."}
		<hr />
		{"You may launch SCREEN using the search box below or browse a curated list of SNPs from the NHGRI-EBI GWAS catalog to annotate genetic variants using cREs."}
		
		<div id={"gwasGroup"}>
		<a className={"btn btn-primary"} href={"/gwasApp/hg19/"} role={"button"}>
		{"Browse GWAS"}
		</a>
		</div>

		</div>);
    }
    
    logo(){
	return (<img
		className={"img-responsive mainLogo"}
		src={"/static/encode/classic-image.jpg"}
		alt={"ENCODE logo"} />);
    }

    searchErr() {
	if(!this.state.userErrMsg){
	    return "";
	}
	return (<span ref="error" style={{color : "#ff0000", fontWeight : "bold"}}>
		{this.state.userErrMsg}
		</span>);
    }
    
    searchBox(){
	let dv = "K562 chr11:5226493-5403124";
	let examples = 'Examples: "K562 chr11:5226493-5403124", "SOX4 TSS", "rs4846913"';
	return (
		<div>
		{this.searchErr()}
		<br />

		<div className={"form-group text-center"}>
		<input ref="searchBox" id={"mainSearchbox"} type={"text"} defaultValue={dv} />
		</div>
		
		<div id={"mainButtonGroup"}>
		<a className={"btn btn-primary btn-lg"} onClick={this.searchHg19} role={"button"}>Search hg19</a>
		{" "}
		<a className={"btn btn-success btn-lg"} onClick={this.searchMm10} role={"button"}>Search mm10</a>
		<br />
		<br />
		<i>{examples}</i>
		</div>
		
            </div>);
    }

    componentDidMount(){
	const loadAuto = (userQuery, callback_f) => {
	    let jq = JSON.stringify({userQuery});
	    if(jq in this.userQueries){
		console.log("getting cached");
		callback_f(this.userQueries[jq]);
		return;
	    }
	    $.ajax({
		url: "/autows/suggestions",
		type: "POST",
		data: jq,
		dataType: "json",
		contentType : "application/json",
		error: function(jqxhr, status, error) {
                    console.log("err during load");
		}.bind(this),
		success: function(r){
		    this.userQueries[jq] = r;
		    callback_f(r);
		}.bind(this)
	    });
	}

	let sb = $("#mainSearchbox");
	sb.autocomplete({
	    source: function (userQuery, callback_f) {
		loadAuto(userQuery.term, callback_f)
	    },
	    select: function(event, ui) {
		sb.val(ui.item.value);
		return false;
	    },
	    change: function() {
	    }
	});
    }
    
    render() {
	return (<div>

		<div className={"row vertical-align"}>

		<div className={"col-md-6"}>
		{this.logo()}
		</div>
		
		<div className={"col-md-6"}>
		<div className={"jumbotron"} id={"mainDesc"}>
		{this.textBox()}
		</div>
		</div>
		
		</div>
		
		<div className={"row"}>
		<div className={"col-md-12 text-center"}>
		{this.searchBox()}
		</div>
		</div>
		
		</div>);
    }
}

const mapStateToProps = (state) => ({ ...state });
const mapDispatchToProps = (dispatch) => ({
    actions: bindActionCreators(Actions, dispatch)
});
export default connect(mapStateToProps, mapDispatchToProps)(TabMain);
