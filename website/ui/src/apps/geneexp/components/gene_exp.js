import React from 'react'
import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';
import $ from 'jquery';

import * as Actions from '../actions/main_actions';

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
	console.log("componentDidMount", this.props);
        this.loadGene(this.props);
    }

    componentWillReceiveProps(nextProps){
        console.log("componentWillReceiveProps", nextProps);
        this.loadGene(nextProps);
    }

    loadGene(p){
	console.log("p", p);
        var q = {assembly: p.assembly,
		 gene: p.search.gene,
		 compartments_selected: p.compartments_selected,
                 biosample_types_selected: p.biosample_types_selected};
	console.log("loadGene", q);
        var jq = JSON.stringify(q);
        if(this.state.jq === jq){
            // http://www.mattzeunert.com/2016/01/28/javascript-deep-equal.html
            return;
        }
        //console.log("loadGene....", this.state.jq, jq);
        this.setState({jq, isFetching: true});
        $.ajax({
            url: "/gews/search",
            type: "POST",
	    data: jq,
	    dataType: "json",
	    contentType: "application/json",
            error: function(jqxhr, status, error) {
                console.log("err loading ge");
                this.setState({isFetching: false, isError: true});
            }.bind(this),
            success: function(r) {
                this.setState({...r, isFetching: false, isError: false});
            }.bind(this)
        });
    }


    doRenderWrapper(){
        if("items" in this.state){
            return <ExpressionBoxplot data={this.state} />;
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
