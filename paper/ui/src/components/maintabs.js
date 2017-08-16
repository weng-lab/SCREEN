import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';

import * as Actions from '../main_actions';

import MainTabs from '../common/components/maintabs.js'

const mapStateToProps = (state) => ({ ...state });
const mapDispatchToProps = (dispatch) => ({
    actions: bindActionCreators(Actions, dispatch)
});
export default connect(mapStateToProps, mapDispatchToProps)(MainTabs);
