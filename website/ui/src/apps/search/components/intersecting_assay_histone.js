import React from 'react'
import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';

import * as Actions from '../actions/main_actions';

import IntersectingAssay from '../../../common/components/intersecting_assay'

class IntersectingAssayHistone extends IntersectingAssay {
    constructor(props) {
	super(props, "/dataws/cre_histone_dcc", "histone");
    }
}

const mapStateToProps = (state) => ({ ...state });
const mapDispatchToProps = (dispatch) => ({
    actions: bindActionCreators(Actions, dispatch) });
export default connect(mapStateToProps, mapDispatchToProps)(IntersectingAssayHistone);
