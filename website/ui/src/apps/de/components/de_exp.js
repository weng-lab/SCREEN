import React from 'react'
import {render} from 'react-dom'
import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';

import * as Actions from '../actions/main_actions';

import ExpressionBoxplot from '../components/expression_boxplot'
import loading from '../../../common/components/loading'

class DeExp extends React.Component{
    constructor(props) {
        super(props);
        this.state = { jq: null, isFetching: true, isError: false };
        this.doRenderWrapper = this.doRenderWrapper.bind(this);
        this.loadDe = this.loadDe.bind(this);
    }

    componentDidMount(){
        this.loadDe(this.props);
    }

    componentWillReceiveProps(nextProps){
        //console.log("componentWillReceiveProps", nextProps);
        this.loadDe(nextProps);
    }

    loadDe({gene}){
        var q = {GlobalAssembly, gene};
        var jq = JSON.stringify(q);
        if(this.state.jq == jq){
            // http://www.mattzeunert.com/2016/01/28/javascript-deep-equal.html
            return;
        }
        //console.log("loadGene....", this.state.jq, jq);
        this.setState({jq, isFetching: true});
        $.ajax({
            url: "/deGeneJson",
            type: "POST",
	    data: jq,
	    dataType: "json",
	    contentType: "application/json",
            error: function(jqxhr, status, error) {
                console.log("err loading cres for table");
                this.setState({isFetching: false, isError: true});
            }.bind(this),
            success: function(r) {
                this.setState({...r, isFetching: false, isError: false});
            }.bind(this)
        });
    }

    doRenderWrapper(){
        let gene = this.props.gene;
        if(gene in this.state){
            return <ExpressionBoxplot data={this.state[gene]} />;
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
export default connect(mapStateToProps, mapDispatchToProps)(DeExp);
