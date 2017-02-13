var React = require('react')
import {connect} from 'react-redux';

import ResultsTable from '../../../common/components/results_table'
import * as Render from '../../../common/renders'

const cols = () => {
    return [
	{
	    title: "accession",
	    data: "candidate-re",
	    className: "dt-right"
	},
	{
	    title: "# supporting exps",
	    data: "evidence",
	    render: Render.support
	},
	{
	    title: "# ChIA-PET exps",
	    data: "evidence.chiapet",
	    render: Render.len
	},
	{
	    title: "ChIA-PET cell types",
	    data: "evidence.chiapet",
	    render: Render.supporting_cts
	},
	{
	    title: "# eQTL exps",
	    data: "evidence.eqtls",
	    render: Render.len
	},
	{
	    title: "eQTL cell types",
	    data: "evidence.eqtls",
	    render: Render.supporting_cts
	}
    ];
};

class CandidateREs extends React.Component {

    constructor(props) {
	super(props);
	this.onClick = this.onClick.bind(this);
    }

    onClick() {
    }

    render() {
	//console.log(this.props.candidate_res);
	return (<div>
		<h2>{GlobalParsedQuery["gene"]}</h2>
		<ResultsTable
                cols={cols()}
                order={[[1, "desc"]]}
                paging={true}
                bInfo={true}
		bfilter={true}
                pageLength={10}
                onTdClick={this.onClick}
		data={this.props.candidate_res} />
		</div>);
    }

}

export default CandidateREs;

const props_map = (f) => (_state) => {
    var state = f(_state);
    return {
	candidate_res: state.candidate_res,
	loading: state.fetching
    };
};

export const candidate_res_connector = (pf) => connect(props_map(pf));
