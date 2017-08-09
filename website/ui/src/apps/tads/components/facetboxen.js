import React from 'react'
import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';

import * as Actions from '../actions/main_actions';

import ListFacet from '../../../common/components/list'
import {panelize} from '../../../common/utility'

const chromBox = ({ chr, chrs, actions }) => {
    let box = (
        <ListFacet
	  title=""
	  items={chrs}
	  selection={chr}
	  onchange={actions.setchromosome} />
    );
    return panelize("Chromosome", box);
};

const biosampleBox = ({ biosample, biosamples, actions }) => {
    let box = (
	<ListFacet
	  title=""
	  items={biosamples}
	  selection={biosample}
	  onchange={actions.setbiosample} />
    );
    return panelize("Biosample for TAD boundaries", box);
};

class FacetBoxen extends React.Component {

    render() {
	return (
	    <div>
		{chromBox(this.props)}
	        {biosampleBox(this.props)}
            </div>
	);
    }
    
}

const mapStateToProps = (state) => ({ ...state });
const mapDispatchToProps = (dispatch) => ({
    actions: bindActionCreators(Actions, dispatch)
});
export default connect(mapStateToProps, mapDispatchToProps)(FacetBoxen);
