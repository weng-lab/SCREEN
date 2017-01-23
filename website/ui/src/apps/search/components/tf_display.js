import React from 'react'
import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';

import * as Actions from '../actions/main_actions';

import loading from '../../../common/components/loading'

class TRBars extends React.Component {
    render() {
	return (<svg width="500" height={this.props.items.length * 30 + 30}>
		{this.props.items.map((item, i) => (
		        <g transform={"translate(0," + (i * 30 + 30) + ")"}>
		        <text transform="translate(0,15)">{item.key}</text>
		        <g transform="translate(75,0)">
			<rect width={item.left * 450} height="10" fill="#0000ff" />
			<rect width={item.right * 450} height="10" transform="translate(0,10)" fill="#00ff00" />
		        </g>
	                </g>
		))}
		</svg>);
    }
}

class TFDisplay extends React.Component {
    constructor(props) {
	super(props);
        this.state = { left: null, right: null, isFetching: true, isError: false,
                       jq : null}
    }

    componentWillReceiveProps(nextProps){
        this.loadTFs(nextProps);
    }

    loadTFs({tree_nodes_compare}) {
        if(null == tree_nodes_compare){
            return;
        }
        var q = {GlobalAssembly, tree_nodes_compare};
        var jq = JSON.stringify(q);
        if(this.state.jq == jq){
            // http://www.mattzeunert.com/2016/01/28/javascript-deep-equal.html
            return;
        }
        //console.log("loadCREs....", this.state.jq, jq);
        this.setState({jq, isFetching: true});
	$.ajax({
	    url: "/dataws/tfenrichment",
	    type: "POST",
	    data: jq,
	    dataType: "json",
	    contentType: "application/json",
            error: function(jqxhr, status, error) {
                console.log("err loading cres for table");
                this.setState({left: null, right: null,
                               jq, isFetching: false, isError: true});
            }.bind(this),
            success: function(r) {
                this.setState({left: r["tfs"]["left"], right: r["tfs"]["right"],
                               jq, isFetching: false, isError: false});
            }.bind(this)
	});
    }

    doRenderWrapper(){
        let left = this.state.left;
        let right = this.state.right;
        if(left && right){
            return (<table>
		<tr><td><b>top</b></td><td><b>bottom</b></td></tr>
		<tr style={{"vertical-align": "top"}}>

                <td style={{"vertical-align": "top"}}>
                <TRBars items={left} /></td>

                <td style={{"vertical-align": "top"}}>
                <TRBars items={right} /></td>

                </tr>
		</table>);
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
    actions: bindActionCreators(Actions, dispatch) });
export default connect(mapStateToProps, mapDispatchToProps)(TFDisplay);
