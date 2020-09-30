/*
 * SPDX-License-Identifier: MIT
 * Copyright (c) 2016-2020 Michael Purcaro, Henry Pratt, Jill Moore, Zhiping Weng
 */

import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';

import * as Actions from '../actions/main_actions';

import IntersectingAssay from '../../../common/components/intersecting_assay'

class IntersectingAssayTf extends IntersectingAssay {
    constructor(props) {
	super(props, "/dataws/cre_tf_dcc", "tf");
    }
}

const mapStateToProps = (state) => ({ ...state });
const mapDispatchToProps = (dispatch) => ({
    actions: bindActionCreators(Actions, dispatch) });
export default connect(mapStateToProps, mapDispatchToProps)(IntersectingAssayTf);
