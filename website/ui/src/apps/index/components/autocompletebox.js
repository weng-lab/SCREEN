import React from 'react'
import $ from 'jquery';

import AutocompleteTextbox from '../../../common/components/autocompletetextbox';

class AutocompleteBox extends React.Component {
    
    constructor(props) {
	super(props);
	this.userQueries = {}; // cache
	this.state = { userQueryErr : null, searchtext: this.props.defaultvalue };
	this.loadSearch = this.loadSearch.bind(this);
	this.searchHg19 = this.searchHg19.bind(this);
	this.searchMm10 = this.searchMm10.bind(this);
	this.handleKeyPress = this.handleKeyPress.bind(this);
    }

    loadSearch(assembly, userQuery, actions) {
	this.setState({userQueryErr : (<i className="fa fa-refresh fa-spin"
				          style={{fontSize : "24px"}}></i>)});
	let jq = JSON.stringify({assembly, userQuery});
	$.ajax({
	    url: "/autows/search",
	    type: "POST",
	    data: jq,
	    dataType: "json",
	    contentType : "application/json",
	    error: function(jqxhr, status, error) {
		this.setState({userQueryErr : "err during load"});
	    }.bind(this),
	    success: (r) => {
		if(r.failed){
		    let userQueryErr = (
			    <span>
			    Error: no results for your query.
			    <br />
			    Please check your spelling and search assembly, and try again.
			    </span>);
		    this.setState({userQueryErr});
		    return;
		}

		if(r.multipleGenes){
		    actions.setGenes(r);
		    actions.setMainTab("query");
		} else {
		    let params = $.param({q: userQuery, assembly});
		    let url = "/search/?" + params;
		    window.location.href = url;
		}
	    }
	});
    }

    searchHg19() {
	let userQuery = this.state.searchtext;
	this.loadSearch("hg19", userQuery, this.props.actions);
    }

    searchMm10() {
	let userQuery = this.state.searchtext;
	this.loadSearch("mm10", userQuery, this.props.actions);
    }

    handleKeyPress = (event) => {
	if(event.key === 'Enter'){
	    this.searchHg19();
	}
    }

    render() {
	let input = <AutocompleteTextbox id={this.props.id}
	                defaultvalue={this.props.defaultvalue}
	                name={this.props.name} size={this.props.size}
   	                className={this.props.className}
  	                onChange={(x) => {this.setState({searchtext: x})}}
	                onEnter={this.searchHg19} />;
	let err = "";
	if (this.state.userQueryErr && !this.props.hideerr) {
	    err = (<span>
		       <span className={"mainPageErr"}>
		           {this.state.userQueryErr}
		       </span>
		       <br />
		   </span>);
	}
	return (<div>
		   <div className={"form-group text-center"}>
		      <span>
		         {err}
		         {input}
		      </span>
	           </div>

		   <div id={"mainButtonGroup"}>
		      <a className={"btn btn-primary btn-lg mainButtonHg19"}
                         onClick={this.searchHg19} role={"button"}>Search Human<br /><small>(hg19)</small></a>
		      {" "}
		      <a className={"btn btn-success btn-lg mainButtonMm10"}
                         onClick={this.searchMm10} role={"button"}>Search Mouse<br /><small>(mm10)</small></a>
		      <br />
		      <br />
		      <i>{this.props.examples}</i>
		   </div>
	       </div>);
    }
    
}
export default AutocompleteBox;
