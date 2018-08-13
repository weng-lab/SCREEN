import React from 'react'

import AutocompleteBox from '../../../common/components/autocompletebox';

import * as ApiClient from '../../../common/api_client';
import {toParams} from '../../../common/utility';

let root = '/' + process.env.PUBLIC_URL.split('/').slice(3).join('/');

class Autocompleter extends React.Component {
    constructor(props) {
	super(props);

 	this.userQueries = {}; // cache
 	this.loadSearch = this.loadSearch.bind(this);
 	this.searchHg38 = this.searchHg38.bind(this);
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
 					  const url = root + "/search/?" + params;
 					  window.location.href = url;
 				      }
 				  },
 				  (msg) => {
 				      this.setState({userQueryErr : "err during load"});
 				  });
    }

    searchHg38() {
 	this.loadSearch("hg38");
    }

    onEnter(){
 	this.loadSearch("hg38");
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
                       onClick={this.searchHg38} role={"button"}>
			Search Human<br /><small>(hg38)</small>
		    </a>
 		    <br />
 		</div>
 	</div>);
    }

}

export default Autocompleter;
