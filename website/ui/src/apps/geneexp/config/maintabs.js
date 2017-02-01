import React from 'react'

import CandidateREs from '../components/candidate_res'
import GeneExp from '../components/gene_exp'

//		<CandidateREs />
class CanRes extends React.Component{
    render() {
        return (<div>

                </div>);
    }
}


const MainTabInfo = {
    gene_expression: {title: "Gene Expression", visible: true,
                      f: GeneExp},
    candidate_res: { title: "Candidate Regulatory Elements", visible: false,
                     f: CanRes }
};

export default MainTabInfo;
