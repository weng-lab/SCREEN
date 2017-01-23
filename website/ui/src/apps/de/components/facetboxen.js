import React from 'react'
import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';

import * as Actions from '../actions/main_actions';

import LongChecklistFacet from '../../../common/components/longchecklist'

import {CHECKLIST_MATCH_ANY} from '../../../common/components/checklist'
import {panelize} from '../../../common/uility'

const cellTypesBox1 = ({cellType, actions}) => {
    return panelize("Cell type 1",
                    <LongListFacet
                    title={""}
                    data={GlobalCellTypeInfoArr}
                    cols={[
		        { title: "cell type", data: "name",
		          className: "dt-right" },
		        { title: "tissue", data: "tissue",
		            className: "dt-right" }
	            ]}
                    order={[]}
                    selection={cellType}
                    friendlySelectionLookup={(value) => {
                        return GlobalCellTypeInfo[value]["name"] }}
                    onTdClick={(value) => { actions.setCellType2(value) }}
                    />);
}

const cellTypesBox2 = ({cellType, actions}) => {
    return panelize("Cell type 2",
                    <LongListFacet
                    title={""}
                    data={GlobalCellTypeInfoArr}
                    cols={[
		        { title: "cell type", data: "name",
		          className: "dt-right" },
		        { title: "tissue", data: "tissue",
		          className: "dt-right" }
	            ]}
                    order={[]}
                    selection={cellType}
                    friendlySelectionLookup={(value) => {
                        return GlobalCellTypeInfo[value]["name"] }}
                    onTdClick={(value) => { actions.setCellType2(value) }}
                    />);
}

class FacetBoxen extends React.Component {
    doRender(p){
        return (<div>
                {cellTypesBox1(p)}
                {cellTypesBox2(p)}
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
