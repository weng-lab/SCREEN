/*
 * SPDX-License-Identifier: MIT
 * Copyright (c) 2016-2020 Michael Purcaro, Henry Pratt, Jill Moore, Zhiping Weng
 */

import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';

import * as Actions from '../actions';

import MainTabs from '../../../common/components/maintabs.js'

const mapStateToProps = (state) => ({ ...state });
const mapDispatchToProps = (dispatch) => ({
    actions: bindActionCreators(Actions, dispatch)
});
export default connect(mapStateToProps, mapDispatchToProps)(MainTabs);
