import React from 'react'
import Autosuggest from 'react-autosuggest';

import * as ApiClient from '../../../common/api_client';

// Imagine you have a list of languages that you'd like to autosuggest.
const languages = [
    {
	name: 'C',
	year: 1972
    },
    {
	name: 'Elm',
	year: 2012
    },
];

// Teach Autosuggest how to calculate suggestions for any given input value.
const getSuggestions = value => {
  const inputValue = value.trim().toLowerCase();
  const inputLength = inputValue.length;

  return inputLength === 0 ? [] : languages.filter(lang =>
    lang.name.toLowerCase().slice(0, inputLength) === inputValue
  );
};

// When suggestion is clicked, Autosuggest needs to populate the input
// based on the clicked suggestion. Teach Autosuggest how to calculate the
// input value for every given suggestion.
const getSuggestionValue = suggestion => suggestion.name;

// Use your imagination to render suggestions.
const renderSuggestion = suggestion => (
  <div>
    {suggestion.name}
  </div>
);

class AutocompleteBox extends React.Component {
  constructor() {
    super();

    // Autosuggest is a controlled component.
    // This means that you need to provide an input value
    // and an onChange handler that updates this value (see below).
    // Suggestions also need to be provided to the Autosuggest,
    // and they are initially empty because the Autosuggest is closed.
    this.state = {
      value: '',
      suggestions: []
    };
  }

  onChange = (event, { newValue }) => {
    this.setState({
      value: newValue
    });
  };

  // Autosuggest will call this function every time you need to update suggestions.
  // You already implemented this logic above, so just use it.
  onSuggestionsFetchRequested = ({ value }) => {
    this.setState({
      suggestions: getSuggestions(value)
    });
  };

  // Autosuggest will call this function every time you need to clear suggestions.
  onSuggestionsClearRequested = () => {
    this.setState({
      suggestions: []
    });
  };

  render() {
    const { value, suggestions } = this.state;

    // Autosuggest will pass through all these props to the input.
    const inputProps = {
      placeholder: 'Type a programming language',
      value,
      onChange: this.onChange
    };

    // Finally, render it!
    return (
      <Autosuggest
        suggestions={suggestions}
        onSuggestionsFetchRequested={this.onSuggestionsFetchRequested}
        onSuggestionsClearRequested={this.onSuggestionsClearRequested}
        getSuggestionValue={getSuggestionValue}
        renderSuggestion={renderSuggestion}
        inputProps={inputProps}
      />
    );
  }
}


/* class AutocompleteBox extends React.Component {
 *     
 *     constructor(props) {
 * 	super(props);
 * 	this.userQueries = {}; // cache
 * 	this.state = { userQueryErr : null, searchtext: this.props.defaultvalue };
 * 	this.loadSearch = this.loadSearch.bind(this);
 * 	this.searchHg19 = this.searchHg19.bind(this);
 * 	this.searchMm10 = this.searchMm10.bind(this);
 * 	this.handleKeyPress = this.handleKeyPress.bind(this);
 *     }
 * 
 *     loadSearch(assembly, userQuery, actions) {
 * 	this.setState({userQueryErr : (<i className="fa fa-refresh fa-spin"
 * 				          style={{fontSize : "24px"}}></i>)});
 * 	const q = {assembly, userQuery};
 * 	const userQueryErr = (
 * 		<span>
 * 		Error: no results for your query.
 * 		<br />
 * 		Please check your spelling and search assembly, and try again.
 * 		</span>);
 * 	
 * 	ApiClient.autocompleteBox(JSON.stringify(q),
 * 				  (r) => {
 * 				      if(r.failed){
 * 					  this.setState({userQueryErr});
 * 					  return;
 * 				      }
 * 				      
 * 				      if(r.multipleGenes){
 * 					  actions.setGenes(r);
 * 					  actions.setMainTab("query");
 * 				      } else {
 * 					  const params = "";//$.param({q: userQuery, assembly});
 * 					  const url = "/search/?" + params;
 * 					  window.location.href = url;
 * 				      }
 * 				  },
 * 				  (msg) => {
 * 				      this.setState({userQueryErr : "err during load"});
 * 				  });
 *     }
 * 
 *     searchHg19() {
 * 	let userQuery = this.state.searchtext;
 * 	this.loadSearch("hg19", userQuery, this.props.actions);
 *     }
 * 
 *     searchMm10() {
 * 	let userQuery = this.state.searchtext;
 * 	this.loadSearch("mm10", userQuery, this.props.actions);
 *     }
 * 
 *     handleKeyPress = (event) => {
 * 	if(event.key === 'Enter'){
 * 	    this.searchHg19();
 * 	}
 *     }
 * 
 *     render() {
 * 
 * 
 * 	let input = <AutocompleteTextbox id={this.props.id}
 * 	   defaultvalue={this.props.defaultvalue}
 * 	   name={this.props.name} size={this.props.size}
 *    	   className={this.props.className}
 *   	   onChange={(x) => {this.setState({searchtext: x})}}
 * 					    onEnter={this.searchHg19} />;
 * 	
* 	let err = "";
* 	if (this.state.userQueryErr && !this.props.hideerr) {
    * 	    err = (<span>
    * 		       <span className={"mainPageErr"}>
    * 		           {this.state.userQueryErr}
    * 		       </span>
    * 		       <br />
    * 		   </span>);
    * 	}
* 	return (<div>
    * 		   <div className={"form-group text-center"}>
    * 		      <span>
    * 		         {err}
    * 		         {}
    * 		      </span>
    * 	           </div>
    * 
    * 		   <div id={"mainButtonGroup"}>
    * 		      <a className={"btn btn-primary btn-lg mainButtonHg19"}
			 *                          onClick={this.searchHg19} role={"button"}>Search Human<br /><small>(hg19)</small></a>
    * 		      {" "}
    * 		      <a className={"btn btn-success btn-lg mainButtonMm10"}
			 *                          onClick={this.searchMm10} role={"button"}>Search Mouse<br /><small>(mm10)</small></a>
    * 		      <br />
    * 		      <br />
    * 		      <i>{this.props.examples}</i>
    * 		   </div>
    * 	       </div>);
*     }
*     
* }*/

export default AutocompleteBox;
