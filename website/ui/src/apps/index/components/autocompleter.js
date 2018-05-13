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

 	this.state = {userQueryErr : null, value: props.defaultvalue,
		      uuid: props.uuid};
    }

    loadSearch(assembly) {
	const userQuery = this.state.value;
	const uuid = this.state.uuid;
 	this.setState({userQueryErr : (<img src={ApiClient.StaticUrl("/spinner.gif")}
				       alt={"loading"} />)});
 	const q = {assembly, userQuery, uuid};
 	const userQueryErr = (
 	    <span>
 		Error: no results for your query.
 		<br />
 		Please check your spelling and search assembly, and try again.
 	    </span>);

 	ApiClient.autocompleteBox(JSON.stringify(q),
 				  (r) => {
 				      if(r.failed){
					  if (assembly === "hg19") {
					      return this.loadSearch("mm10");
					  } else {
 					      this.setState({userQueryErr});
					      return;
					  }
 				      }

 				      if(r.multipleGenes){
 					  this.props.actions.setGenes(r);
 					  this.props.actions.setMainTab("query");
 				      } else {
 					  const params = toParams({q: userQuery,
								   assembly, uuid});
 					  const url = "/search/?" + params;
 					  window.location.href = url;
 				      }
 				  },
 				  (msg) => {
 				      this.setState({userQueryErr : "err during load"});
 				  });
    }

    searchHg19() {
 	this.loadSearch("hg19");
    }

    searchMm10() {
 	this.loadSearch("mm10");
    }

    onEnter(){
	if (this.state.value.includes("mouse") || this.state.value.includes("mm10")) {
	    return this.loadSearch("mm10");
	}
 	this.loadSearch("hg19");
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
 				     onEnter={this.onEnter}
             theme={{
  container:                'react-autosuggest__container',
  containerOpen:            'react-autosuggest__container--open',
  input:                    'react-autosuggest__input_index',
  inputOpen:                'react-autosuggest__input--open',
  inputFocused:             'react-autosuggest__input--focused',
  suggestionsContainer:     'react-autosuggest__suggestions-container_index',
  suggestionsContainerOpen: 'react-autosuggest__suggestions-container--open_index',
  suggestionsList:          'react-autosuggest__suggestions-list',
  suggestion:               'react-autosuggest__suggestion',
  suggestionFirst:          'react-autosuggest__suggestion--first',
  suggestionHighlighted:    'react-autosuggest__suggestion--highlighted',
  sectionContainer:         'react-autosuggest__section-container',
  sectionContainerFirst:    'react-autosuggest__section-container--first',
  sectionTitle:             'react-autosuggest__section-title'
}}
		    />;

 	let err = "";
 	if (this.state.userQueryErr) {
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
		<em>{this.props.instructions}</em><br/>
 		    <em>{this.props.examples}</em><br/><br/>
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
 		</div>
 	</div>);
    }

}

export default Autocompleter;
