/*
 * SPDX-License-Identifier: MIT
 * Copyright (c) 2016-2020 Michael Purcaro, Henry Pratt, Jill Moore, Zhiping Weng
 */

import React from "react";
import { connect } from "react-redux";
import { bindActionCreators } from "redux";

import { Button } from "react-bootstrap";
import AutocompleteBox from "./autocompletebox";
import { toParams } from "../utility";

import * as Actions from "../actions/searchbox_actions";

class SearchBox extends React.Component {
  constructor(props, key) {
    super(props);
    this.state = { jq: null, searchtext: this.makeVal(this.props) };
  }

  _search = () => {
    const params = toParams({
      q: this.state.searchtext,
      assembly: this.props.assembly,
      uuid: this.props.uuid,
    });
    const url = "/search/?" + params;
    window.location.href = url;
    return false;
  };

  makeVal(p) {
    let r = "";
    if (p.coord_chrom && p.coord_start && p.coord_end) {
      r += p.coord_chrom + ":" + p.coord_start + "-" + p.coord_end + " ";
    } else if (p.coord_start && p.coord_end) {
      r += p.coord_start + "-" + p.coord_end + " ";
    }

    if (p.cellType) {
      r += p.cellType;
    }

    return r;
  }

  UNSAFE_componentWillReceiveProps(nextProps) {
    var val = this.makeVal(nextProps);
    var jq = JSON.stringify(val);
    if (this.state.jq !== jq) {
      //this.refs.input.value = val;
      this.setState({ jq });
    }
  }

  render() {
    const shouldRenderSuggestions = (v) => {
      return false;
    };
    const loadSugg = (v) => {
      return v;
    };

    return (
      <div>
        <AutocompleteBox
          shouldRenderSuggestions={shouldRenderSuggestions}
          loadSugg={loadSugg}
          defaultvalue={this.state.searchtext}
          id="acnav"
          name="q"
          style={{ float: "left" }}
          hideerr="true"
          actions={this.props.actions}
          size={100}
          className="searchbox"
          onChange={(t) => {
            this.setState({ searchtext: t });
          }}
          onEnter={this._search}
          assemblies={[this.props.assembly]}
          theme={{
            container: "react-autosuggest__container",
            containerOpen: "react-autosuggest__container--open_navbar",
            input: "react-autosuggest__input_navbar",
            inputOpen: "react-autosuggest__input--open",
            inputFocused: "react-autosuggest__input--focused",
            suggestionsContainer:
              "react-autosuggest__suggestions-container_navbar",
            suggestionsContainerOpen:
              "react-autosuggest__suggestions-container--open_navbar",
            suggestionsList: "react-autosuggest__suggestions-list",
            suggestion: "react-autosuggest__suggestion",
            suggestionFirst: "react-autosuggest__suggestion--first",
            suggestionHighlighted: "react-autosuggest__suggestion--highlighted",
            sectionContainer: "react-autosuggest__section-container",
            sectionContainerFirst:
              "react-autosuggest__section-container--first",
            sectionTitle: "react-autosuggest__section-title",
          }}
        />
        &nbsp;
        <Button onClick={this._search}>Search</Button>
      </div>
    );
  }
}

const mapStateToProps = (state) => ({ ...state });
const mapDispatchToProps = (dispatch) => ({
  actions: bindActionCreators(Actions, dispatch),
});
export default connect(mapStateToProps, mapDispatchToProps)(SearchBox);
