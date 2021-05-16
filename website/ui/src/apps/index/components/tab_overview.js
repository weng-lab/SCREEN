/*
 * SPDX-License-Identifier: MIT
 * Copyright (c) 2016-2020 Michael Purcaro, Henry Pratt, Jill Moore, Zhiping Weng
 */

import React from "react";
import { connect } from "react-redux";
import { bindActionCreators } from "redux";
import { Grid, Button, Container, Segment } from 'semantic-ui-react';

import Autocompleter from "./autocompleter";
import * as ApiClient from "../../../common/api_client";
import * as Actions from "../actions";
import * as Para from "./tab_about_paragraphs";

const TextBox = () => (
    <Segment padded raised style={{backgroundColor: "#ffebc8"}}>
    <Grid columns={16}>
      <Grid.Row>
        <Grid.Column width={16}>
          <p>SCREEN is a web interface for searching and visualizing the Registry of candidate cis-Regulatory Elements (cCREs) derived from{" "}
            <a href={"https://encodeproject.org/"} target={"_blank"}>ENCODE data</a>.
        The Registry contains 926,535 human cCREs in GRCh38 and 339,815 mouse cCREs in mm10, with homologous cCREs cross-referenced across
          species. SCREEN presents the data that support biochemical activities of the cCREs and the expression of nearby genes in
          specific cell and tissue types.
        </p>
        </Grid.Column>
      </Grid.Row>
      <Grid.Row>
        <Grid.Column width={12}>
          <p>You may launch SCREEN using the search box below or browse a curated list of SNPs from the NHGRI-EBI Genome Wide Association Study (GWAS)
          catalog to annotate genetic variants using cCREs.
        </p>
        </Grid.Column>
        <Grid.Column width={4}>
          <Button primary as='a' href="/gwasApp/?assembly=GRCh38">{"Browse GWAS"}<br />{"(GRCh38)"}</Button>
        </Grid.Column>
      </Grid.Row>
    </Grid>    
  </Segment>
);

const Logo = () => (
  <img
    className={"img-responsive mainLogo"}
    src={ApiClient.StaticUrl("/encode/classic-image3.jpg")}
    alt={"ENCODE logo"}
  />
);

class TabOverview extends React.Component {
  searchBox() {
    let instructions =
      "Enter a gene name or alias, a SNP rsID, a cCRE accession, or a genomic region in the form chr:start-end. You may also enter a cell type name to filter results.";
    let examples =
      'Examples: "K562 chr11:5205263-5381894", "SOX4", "rs4846913", "EH38E1613479"';
    let dv = "chr11:5205263-5381894";
    return (
      <Autocompleter
        defaultvalue={dv}
        uuid={this.props.uuid}
        actions={this.props.actions}
        id="mainSearchbox"
        examples={examples}
        instructions={instructions}
      />
    );
  }

  render() {
    return (
      <Container>
        <Grid>
          <Grid.Row columns={2}>
            <Grid.Column><Logo /></Grid.Column>
            <Grid.Column><TextBox /></Grid.Column>
          </Grid.Row>

          <Grid.Row columns={1}>
            <Grid.Column>{this.searchBox()}</Grid.Column>
          </Grid.Row>

          <Grid.Row columns={1}>
            <Grid.Column>
              <h4>How to Cite the ENCODE Encyclopedia, the Registry of cCREs, and SCREEN</h4>
              {Para.citation()}
            </Grid.Column>
          </Grid.Row>
        </Grid>
      </Container>
    );
  }
}

const mapStateToProps = (state) => ({ ...state });
const mapDispatchToProps = (dispatch) => ({
  actions: bindActionCreators(Actions, dispatch),
});
export default connect(mapStateToProps, mapDispatchToProps)(TabOverview);
