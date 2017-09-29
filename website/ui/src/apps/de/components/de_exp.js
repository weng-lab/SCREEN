import React from 'react'
import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';
import $ from 'jquery';

import * as Actions from '../actions/main_actions';

import DePlot from '../components/de_plot';
import loading from '../../../common/components/loading';
import {arrowNote} from '../../../common/utility';

class DeExp extends React.Component{
    constructor(props) {
        super(props);
        this.state = { jq: null, isFetching: true, isError: false,
                       selectCT: false };
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

    loadDe(p){
	console.log("loadDe", p);
        if(null === p.ct1 || null === p.ct2){
            this.props.actions.setDes(null);
            this.setState({selectCT: true});
            return;
        }
        const q = {assembly: p.assembly, gene: p.gene, ct1: p.ct1, ct2: p.ct2};
        const jq = JSON.stringify(q);
        if(this.state.jq === jq){
            // http://www.mattzeunert.com/2016/01/28/javascript-deep-equal.html
            return;
        }
        //console.log("loadGene....", this.state.jq, jq);
        this.setState({jq, isFetching: true, selectCT: false});
        $.ajax({
            url: "/dews/search",
            type: "POST",
	    data: jq,
	    dataType: "json",
	    contentType: "application/json",
            error: function(jqxhr, status, error) {
                console.log("err during load");
                this.setState({isFetching: false, isError: true});
            }.bind(this),
            success: function(r) {
                this.setState({...r, isFetching: false, isError: false});
                p.actions.setDes(r[p.gene]);
            }.bind(this)
        });
    }

    doRenderWrapper(){
        if(this.state.selectCT){
            return arrowNote("Please choose 2 cell types.");
        }
        if(this.state.isError){
            return (
		<div>
                    <h2>{"Error during load; please refresh the page"}
                    </h2>
                </div>);
        }

        let gene = this.props.gene;
        if(gene in this.state){
	    const data = this.state[gene];
	    if(!data.nearbyDEs.data){
		return (
		    <div>
                        <span style={{fontStyle: "italic"}}>{gene}</span>
			{ " is not differentially expressed between "
			  + this.props.ct1 + " and " + this.props.ct2 +
			  " at FDR threshold of 0.05" }
		    </div>);
            }
	    return React.createElement(DePlot, {...this.props, data: data});
        }
        return loading(this.state);
    }

    render(){
        return (
	    <div style={{"width": "100%"}} >
                {this.doRenderWrapper()}
            </div>);
    }
}

const mapStateToProps = (state) => ({ ...state });
const mapDispatchToProps = (dispatch) => ({
    actions: bindActionCreators(Actions, dispatch)
});
export default connect(mapStateToProps, mapDispatchToProps)(DeExp);
