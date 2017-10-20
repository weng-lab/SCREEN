import React from 'react'
import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';

import * as Actions from '../actions/main_actions';
import * as ApiClient from '../../../common/api_client';

import ExpressionBoxplot from '../components/expression_boxplot'
import loading from '../../../common/components/loading'

class GeneExp extends React.Component{
    constructor(props) {
        super(props);
        this.state = { jq: null, isFetching: true, isError: false };
        this.doRenderWrapper = this.doRenderWrapper.bind(this);
        this.loadGene = this.loadGene.bind(this);
    }

    componentDidMount(){
        this.loadGene(this.props);
    }

    componentWillReceiveProps(nextProps){
        this.loadGene(nextProps);
    }

    makeKey(p){
	return {assembly: p.assembly,
		accession: p.cre_accession_detail,
		gene: p.gene,
		compartments_selected: Array.from(p.compartments_selected),
                biosample_types_selected: Array.from(p.biosample_types_selected)};
    }
    
    loadGene(p){
	const q = this.makeKey(p);
        const jq = JSON.stringify(q);
        if(this.state.jq === jq){
            // http://www.mattzeunert.com/2016/01/28/javascript-deep-equal.html
            return;
        }
        this.setState({jq, isFetching: true});
	ApiClient.getByPost(jq, "/gews/search",
			    (r) => {
				this.setState({[jq]: r, isFetching: false, isError: false});
			    },
			    (msg) => {
				console.log("err loading ge");
				this.setState({isFetching: false, isError: true});
			    });
    }

    doRenderWrapper(){
	const q = this.makeKey(this.props);
        const jq = JSON.stringify(q);
        if(jq in this.state){
	    const data = this.state[jq];
            return React.createElement(ExpressionBoxplot, {...this.props, data});
        }
        return loading(this.state);
    }

    render(){
        return (<div style={{"width": "100%"}} >
                {this.doRenderWrapper()}
                </div>);
    }
}

const mapStateToProps = (state) => ({ ...state });
const mapDispatchToProps = (dispatch) => ({
    actions: bindActionCreators(Actions, dispatch)
});
export default connect(mapStateToProps, mapDispatchToProps)(GeneExp);
