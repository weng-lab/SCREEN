import React from 'react'
import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';

import * as Actions from '../actions/main_actions';

import LongListFacet from '../../../common/components/longlist'

import {CHECKLIST_MATCH_ANY} from '../../../common/components/checklist'
import {panelize} from '../../../common/utility'

const gwas_studies = ({gwas_study, actions}) => {
    return panelize("GWAS Studies",
                    <LongListFacet
                    title={""}
                    data={Globals.gwas.studies}
                    cols={[{
		        title: "Assay", data: "value",
		        className: "dt-right"
	            }]}
                    order={[]}
		    selection={gwas_study}
        	    mode={CHECKLIST_MATCH_ANY}
                    onTdClick={(c) => { actions.setStudy(c) } }
                    />);
}

class FacetBoxen extends React.Component {
    doRender(p){
        return (<div>
                {gwas_studies(p)}
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
