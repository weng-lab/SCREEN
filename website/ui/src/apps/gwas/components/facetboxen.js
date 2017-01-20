import React from 'react'
import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';

import * as Actions from '../actions/main_actions';

import ChecklistFacet from '../../../common/components/checklist'

const panelize = (title, facet) => {
    return (<div className="panel-group facet">
	    <div className="panel panel-primary">
	    <div className="panel-heading">{title}</div>
	    <div className="panel-body">
            {facet}
	    </div>
	    </div>
	    </div>);
};

class FacetBoxen extends React.Component {
    doRender(p){
        return (<div>
                </div>);
    }

    render() {
        return this.doRender(this.props)
    }
}

const mapStateToProps = (state) => ({
        ...state
});

const mapDispatchToProps = (dispatch) => ({
    actions: bindActionCreators(Actions, dispatch)
});

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(FacetBoxen);
