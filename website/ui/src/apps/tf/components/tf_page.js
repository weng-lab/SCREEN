import React from 'react'
import {render} from 'react-dom'
import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';

import * as Actions from '../actions/main_actions';

import {TRBars} from '../../search/components/tf_display'
import loading from '../../../common/components/loading'

class TfPage extends React.Component{
    constructor(props) {
        super(props);
        this.state = { jq: null, isFetching: false, isError: false, isDone: false,
                       selectCT: false };
        this.doRenderWrapper = this.doRenderWrapper.bind(this);
        this.loadTf = this.loadTf.bind(this);
    }

    componentDidMount(){
        this.loadTf(this.props);
    }

    componentWillReceiveProps(nextProps){
	this.setState({isDone: false});
    }

    loadTf({ct1, ct2}){
        if(null == ct1 || null == ct2){
            this.setState({selectCT: true});
            return;
        }
	let tree_nodes_compare = [[], []];
	for (let i of ct1) {
	    tree_nodes_compare[0].push(Globals.cellTypeInfoArr[i].value);
	}
	for (let i of ct2) {
	    tree_nodes_compare[1].push(Globals.cellTypeInfoArr[i].value);
	}
        var q = {GlobalAssembly, tree_nodes_compare, tree_rank_method: "DNase"};
        var jq = JSON.stringify(q);
        if(this.state.jq == jq || !tree_nodes_compare[0] || !tree_nodes_compare[1]){
            // http://www.mattzeunert.com/2016/01/28/javascript-deep-equal.html
            return;
        }
        //console.log("loadGene....", this.state.jq, jq);
	console.log("loading...");
        this.setState({jq, isFetching: true, selectCT: false, isDone: false});
	$.ajax({
	    url: "/dataws/tfenrichment",
	    type: "POST",
	    data: jq,
	    dataType: "json",
	    contentType: "application/json",
            error: function(jqxhr, status, error) {
                console.log("err loading cres for table");
                this.setState({left: null, right: null, isDone: true,
                               jq, isFetching: false, isError: true});
            }.bind(this),
            success: function(r) {
                this.setState({left: r["tfs"]["left"], right: r["tfs"]["right"],
                               title: r["title"],
                               jq, isFetching: false, isError: false});
            }.bind(this)
	});
    }

    doRenderWrapper(){
        if (this.state.isDone && !this.state.isFetching) {
            return (<div>

                    <table>
		    <tr><td><b>top</b></td><td><b>bottom</b></td></tr>
		    <tr style={{"vertical-align": "top"}}>

                    <td style={{"vertical-align": "top"}}>
                    <TRBars items={left} /></td>

                    <td style={{"vertical-align": "top"}}>
                    <TRBars items={right} /></td>

                    </tr>
		    </table>
                   </div>);
        } else if (!this.state.isFetching) {
	    return <button onClick={() => {this.loadTf(this.props)}}>Compute</button>;
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
export default connect(mapStateToProps, mapDispatchToProps)(TfPage);
