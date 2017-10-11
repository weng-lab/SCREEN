import React from 'react'

import AutocompleteBox from '../../../common/components/autocompletebox';

import * as ApiClient from '../../../common/api_client';
import {toParams} from '../../../common/utility';

class Autocompleter extends React.Component {
    constructor(props) {
	super(props);

 	this.userQueries = {}; // cache
 	this.loadSearch = this.loadSearch.bind(this);
 	this.searchHg19 = this.searchHg19.bind(this);
 	this.searchMm10 = this.searchMm10.bind(this);
 	this.onEnter = this.onEnter.bind(this);
	this.onChange = this.onChange.bind(this);

 	this.state = {userQueryErr : null, value: props.defaultvalue};
    }

    loadSearch(assembly, userQuery, actions) {
 	this.setState({userQueryErr : (<i className="fa fa-refresh fa-spin"
 				          style={{fontSize : "24px"}}></i>)});
 	const q = {assembly, userQuery};
 	const userQueryErr = (
 	    <span>
 		Error: no results for your query.
 		<br />
 		Please check your spelling and search assembly, and try again.
 	    </span>);
 	
 	ApiClient.autocompleteBox(JSON.stringify(q),
 				  (r) => {
 				      if(r.failed){
 					  this.setState({userQueryErr});
 					  return;
 				      }
 				      
 				      if(r.multipleGenes){
 					  actions.setGenes(r);
 					  actions.setMainTab("query");
 				      } else {
 					  const params = toParams({q: userQuery,
								   assembly});
 					  const url = "/search/?" + params;
 					  window.location.href = url;
 				      }
 				  },
 				  (msg) => {
 				      this.setState({userQueryErr : "err during load"});
 				  });
    }
    
    searchHg19() {
 	this.loadSearch("hg19", this.state.value, this.props.actions);
    }
    
    searchMm10() {
 	this.loadSearch("mm10", this.state.value, this.props.actions);
    }
    
    onEnter(){
 	this.loadSearch("hg19", this.state.value, this.props.actions);
    }

    onChange(value){
	this.setState({value});
    }
    
    render() {
 	let input = <AutocompleteBox defaultvalue={this.props.defaultvalue}
				     name={this.props.name}
				     size={this.props.size}
    				     className={this.props.className}
				     onChange={this.onChange}
 				     onEnter={this.searchHg19}
		    />;
	
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
                       onClick={this.searchHg19} role={"button"}>
			Search Human<br /><small>(hg19)</small>
		    </a>
 		    {" "}
 		    <a className={"btn btn-success btn-lg mainButtonMm10"}
                       onClick={this.searchMm10} role={"button"}>
			Search Mouse<br /><small>(mm10)</small>
		    </a>
 		    <br />
 		    <br />
 		    <i>{this.props.examples}</i>
 		</div>
 	</div>);
    }
    
}

export default Autocompleter;
