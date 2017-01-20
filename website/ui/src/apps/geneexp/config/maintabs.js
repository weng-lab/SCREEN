import React from 'react'

import ExpressionBoxplot from '../components/expression_boxplot'
import CandidateREs from '../components/candidate_res'


//		<CandidateREs />

class GeneExp extends React.Component{
    render() {
        console.log("GeneExp", "in render", this.props);
        return (<div>
                <ExpressionBoxplot />
                </div>);
    }
}

class CanRes extends React.Component{
    render() {
        return (<div>

                </div>);
    }
}


const MainTabInfo = {
    gene_expression: {title: "Gene Expression", visible: true,
                      f: GeneExp},
    candidate_res: { title: "Candidate Regulatory Elements", visible: true,
                     f: CanRes }
};

export default MainTabInfo;
