import React from "react";
import { connect } from "react-redux";
import { bindActionCreators } from "redux";
import { Grid, Segment } from 'semantic-ui-react'

import * as Actions from "./actions/main_actions";

import ResultsTableContainer from "./components/results_table_container";
import FacetBoxen from "./components/facetboxen";

class ResultsTab  extends React.Component {
    render(){
        console.log(this.props);
        
    const { active_cre, showCart } = this.props;
  
console.log(active_cre);

    return (
      <Grid>
        <Grid.Row>
          {!showCart && <Grid.Column width={4}>
            <Segment>
              <FacetBoxen {...this.props} />
            </Segment>
          </Grid.Column>}
          <Grid.Column width={showCart ? 16 : 12 }>
            <ResultsTableContainer {...this.props} />
          </Grid.Column>
        </Grid.Row>
      </Grid>
    );
    }
  }

  const mapStateToProps = (state) => ({ ...state });
  const mapDispatchToProps = (dispatch) => ({
    actions: bindActionCreators(Actions, dispatch),
  });
  export default connect(
    mapStateToProps,
    mapDispatchToProps
  )(ResultsTab);
    