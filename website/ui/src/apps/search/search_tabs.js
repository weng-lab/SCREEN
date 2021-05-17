import React from "react";
import { connect } from "react-redux";
import { bindActionCreators } from "redux";
import { BrowserRouter as Router, Route, Switch } from "react-router-dom";
import queryString from 'query-string'

import BedUpload from "./components/bed_upload";
import ConfigureGenomeBrowser from "./components/configure_genome_browser";
import DetailsContainer from "./components/details_container";
import DetailsTabInfo from "./config/details";
import GeneExp from "../geneexp/components/gene_exp";
import RampagePlot from "./components/rampage_plot";

import ResultsTab from "./results_tab";
import HeaderMenu from "./headerMenu";

import * as Actions from "./actions/main_actions";
import * as Render from "../../common/zrenders";

class DetailsTab extends React.Component {
  render() {
    return React.createElement(DetailsContainer, {
      ...this.props,
      tabs: DetailsTabInfo(this.props.assembly, this.props),
    });
  }
}

class SearchTabs extends React.Component {
    render(){
      const { search, globals, query } = this.props;
      const { uuid, parsedQuery } = search;
      const { assembly, genes } = parsedQuery;

      const gene = genes.length > 0 ? genes[0].approved_symbol : null;
      const geTitle = gene ? Render.tabTitle([gene, "Gene Expression"]) : "";
      const rTitle = gene ? Render.tabTitle([gene, "RAMPAGE"]) : "";
      const showRampage = "mm10" !== assembly && !!gene;
      const showCart = "cart" in query;
      const showCRE = this.props.active_cre;
      const showCREurl = this.props.active_cre ? this.props.active_cre.accession : '';
      const showCREtitle = this.props.active_cre ? this.props.active_cre.accession : 'cCRE';

      console.log(this.props);

      let resultsTitle = showCart ? "cCREs in Cart" : Render.tabTitle(["cCRE", "Search Results"]);

        return (
          <Router>
          <HeaderMenu onItemClick={item => this.onItemClick(item)}
            items={[
              ["cCRE Search Results", "/search/"  + "?" + queryString.stringify(query), true],
              ["Bed Upload", "/search/bedupload/" + "?" + queryString.stringify(query), true],
              [geTitle, "/search/geneexpression/", !!gene],
              [rTitle, "/search/rampage/", showRampage],
              [showCREtitle + " Details", "/search/ccre/" + showCREurl, showCRE],
              ["Configure Genome Browser", "/search/genomebrowser/", false],
            ]} />

          <Switch>
            <Route path="/search" exact><ResultsTab {...this.props} {...{ assembly, showCart }} /></Route>
            <Route path="/search/bedupload"><BedUpload {...this.props} {...{ assembly, showCart }}/></Route>
            <Route path="/search/geneexpression"><GeneExp {...this.props} {...{ gene }} /></Route>
            <Route path="/search/rampage"><RampagePlot {...this.props} {...{ gene }} /></Route>
            <Route path="/search/ccre"><DetailsTab {...this.props} /></Route>
            <Route path="/search/genomebrowser"><ConfigureGenomeBrowser /></Route>
          </Switch>
        </Router>
        )
    }
}

const mapStateToProps = (state) => ({ ...state });
const mapDispatchToProps = (dispatch) => ({
  actions: bindActionCreators(Actions, dispatch),
});
export default connect(
  mapStateToProps,
  mapDispatchToProps
)(SearchTabs);