import React from 'react'
import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';

import * as Actions from '../actions/main_actions';

import LongChecklistFacet from '../../../common/components/longchecklist'

import {CHECKLIST_MATCH_ANY} from '../../../common/components/checklist'
import {panelize} from '../../../common/uility'

const cell_compartments = ({compartments, actions}) => {
    return panelize("Cellular Compartments",
                    <LongChecklistFacet
                    title={""}
                    data={compartments.map((e) => {return {key: e,
                                                           selected: true}})}
                    cols={[{
		        title: "Assay", data: "key",
		        className: "dt-right"
	            }]}
                    order={[]}
        	    mode={CHECKLIST_MATCH_ANY}
                    onTdClick={(c) => { actions.toggleCompartment(c) } }
                    />);
}

class FacetBoxen extends React.Component {
    doRender(p){
        return (<div>
                {cell_compartments(p)}
                </div>);
    }

    render() {
        return this.doRender(this.props)
    }
}

const mapStateToProps = (state) => ({ ...state });
const mapDispatchToProps = (dispatch) => ({
    actions: bindActionCreators(Actions, dispatch)
});
export default connect(mapStateToProps, mapDispatchToProps)(FacetBoxen);
