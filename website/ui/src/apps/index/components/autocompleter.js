/*
 * SPDX-License-Identifier: MIT
 * Copyright (c) 2016-2020 Michael Purcaro, Henry Pratt, Jill Moore, Zhiping Weng
 */

import React from "react";
import { Container, Button } from 'semantic-ui-react';

import AutocompleteBox from "../../../common/components/autocompletebox";

import * as ApiClient from "../../../common/api_client";
import { toParams } from "../../../common/utility";

class Autocompleter extends React.Component {
  constructor(props) {
    super(props);

    this.userQueries = {}; // cache
    this.loadSearch = this.loadSearch.bind(this);
    this.onEnter = this.onEnter.bind(this);
    this.onChange = this.onChange.bind(this);

    this.state = {
      userQueryErr: null,
      value: props.defaultvalue,
      uuid: props.uuid,
    };
  }

  loadSearch(assembly) {
    const userQuery = this.state.value;
    const uuid = this.state.uuid;
    this.setState({
      userQueryErr: (
        <img src={ApiClient.StaticUrl("/spinner.gif")} alt={"loading"} />
      ),
    });
    const q = { assembly, userQuery, uuid };
    const userQueryErr = (
      <span>
        Error: no results for your query.
        <br />
        Please check your spelling and search assembly, and try again.
      </span>
    );

    ApiClient.autocompleteBox(
      JSON.stringify(q),
      (r) => {
        if (r.failed) {
          if (assembly === "hg19") {
            return this.loadSearch("mm10");
          } else {
            this.setState({ userQueryErr });
            return;
          }
        }

        if (r.multipleGenes) {
          this.props.actions.setGenes(r);
          this.props.actions.setMainTab("query");
        } else {
          const params = toParams({ q: userQuery, assembly, uuid });
          const url = "/search/?" + params;
          window.location.href = url;
        }
      },
      (msg) => {
        this.setState({ userQueryErr: "err during load" });
      }
    );
  }

  onEnter() {
    this.loadSearch("GRCh38");
  }

  onChange(value) {
    this.setState({ value });
  }

  render() {
    let input = (
      <AutocompleteBox
        defaultvalue={this.props.defaultvalue}
        name={this.props.name}
        size={this.props.size}
        className={this.props.className}
        onChange={this.onChange}
        onEnter={this.onEnter}
        theme={{
          container: "react-autosuggest__container",
          containerOpen: "react-autosuggest__container--open",
          input: "react-autosuggest__input_index",
          inputOpen: "react-autosuggest__input--open",
          inputFocused: "react-autosuggest__input--focused",
          suggestionsContainer:
            "react-autosuggest__suggestions-container_index",
          suggestionsContainerOpen:
            "react-autosuggest__suggestions-container--open_index",
          suggestionsList: "react-autosuggest__suggestions-list",
          suggestion: "react-autosuggest__suggestion",
          suggestionFirst: "react-autosuggest__suggestion--first",
          suggestionHighlighted: "react-autosuggest__suggestion--highlighted",
          sectionContainer: "react-autosuggest__section-container",
          sectionContainerFirst: "react-autosuggest__section-container--first",
          sectionTitle: "react-autosuggest__section-title",
        }}
      />
    );

    let err = "";
    if (this.state.userQueryErr) {
      err = (
        <span>
          <span className={"mainPageErr"}>{this.state.userQueryErr}</span>
          <br />
        </span>
      );
    }
    return (
      <Container textAlign="center">
        <span>
          {err}
          {input}
        </span>
        <em>{this.props.instructions}</em>
        <br />
        <em>{this.props.examples}</em>
        <br />

        <Button primary onClick={() => this.loadSearch("GRCh38") }>
          {"Search Human"}<br /><small>{"(GRCh38)"}</small>
        </Button>
        <Button primary onClick={() => this.loadSearch("mm10") }>
          {"Search Mouse"}<br /><small>{"(mm10)"}</small>
        </Button>
        
        <br />
        <em>
          <strong>
            Pressing enter in the search box searches GRCh38. To search mm10, click the button above.
            </strong>
        </em>
      </Container>
    );
  }
}

export default Autocompleter;
