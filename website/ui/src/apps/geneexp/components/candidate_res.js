var React = require('react')
import {connect} from 'react-redux';

import ResultsTable from '../../../common/components/results_table'

const render_support = (support) => (
    ("eqtls" in support ? support.eqtls.length : 0) + ("chiapet" in support ? support.chiapet.length : 0)
);
const render_length = (list) => (list ? list.length : 0);
const render_supporting_cts = (list) => {
    if (list == null) return "";
    var map = {};
    list.map((x) => {
	if (!(x["cell-type"] in map)) map[x["cell-type"]] = 0;
	++map[x["cell-type"]];
    });
    return Object.keys(map).map((k) => (k + " (" + map[k] + ")")).join(", ");
};

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
	    render: render_support
	},
	{
	    title: "# ChIA-PET exps",
	    data: "evidence.chiapet",
	    render: render_length
	},
	{
	    title: "ChIA-PET cell types",
	    data: "evidence.chiapet",
	    render: render_supporting_cts
	},
	{
	    title: "# eQTL exps",
	    data: "evidence.eqtls",
	    render: render_length
	},
	{
	    title: "eQTL cell types",
	    data: "evidence.eqtls",
	    render: render_supporting_cts
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
	console.log(this.props.candidate_res);
	return (<div>
		   <h2>{GlobalParsedQuery["gene"]}</h2>
		   <ResultsTable cols={cols()} order={[[1, "desc"]]} paging={true} bInfo={true}
		      bfilter={true} pageLength={10} onTdClick={this.onClick}
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
