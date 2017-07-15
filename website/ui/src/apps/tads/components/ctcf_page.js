import React from 'react'
import {render} from 'react-dom'
import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';

import * as Actions from '../actions/main_actions';

import {TRBars} from '../../search/components/tf_display'
import loading from '../../../common/components/loading'

class CTCFPage extends React.Component{
    
    constructor(props) {
        super(props);
        this.state = {
	    jq: null, selectChr: false,
	    isFetching: true, isError: false, isDone: false
        };
        this.doRenderWrapper = this.doRenderWrapper.bind(this);
        this.loadChr = this.loadChr.bind(this);
    }

    componentDidMount() {
        this.loadChr(this.props);
    }

    componentWillReceiveProps(nextProps) {
	this.loadChr(nextProps);
    }

    loadChr({ chr, actions }) {
	
        if (null == chr) {
            this.setState({ selectChr: true });
            return;
        }
	
	actions.setloading();
        var jq = JSON.stringify({ GlobalAssembly, chr });
        if (this.state.jq == jq) { return; }
        this.setState({ jq, isFetching: true, selectChr: false, isDone: false });
	
	$.ajax({
	    url: "/dataws/ctcfdistr",
	    type: "POST",
	    data: jq,
	    dataType: "json",
	    contentType: "application/json",
            error: ( (jqxhr, status, error) => {
                console.log("ERROR: CTCF distribution failed to load");
                this.setState({
		    data: null, jq,
                    isDone: true, isFetching: false, isError: true
		});
            } ).bind(this),
            success: ( r => {
                this.setState({
		    data: r["data"], jq, isDone: true,
                    isFetching: false, isError: false
		});
            } ).bind(this)
	});
	
    }

    doRenderWrapper(){
	if (this.state.selectChr) {
	    return (
		<div><strong>Please select a chromosome at left</strong></div>
	    );
	} else if (this.state.isDone && !this.state.isFetching) {
            return (
		<div>
		    {this.state.data[0]}, {this.state.data[1]}
                </div>
	    );
        }
        return loading(this.state);
    }

    render(){
        return (
            <div style={{"width": "100%"}}>
                {this.doRenderWrapper()}
            </div>
	);
    }
}

const mapStateToProps = (state) => ({ ...state });
const mapDispatchToProps = (dispatch) => ({
    actions: bindActionCreators(Actions, dispatch)
});
export default connect(mapStateToProps, mapDispatchToProps)(CTCFPage);
