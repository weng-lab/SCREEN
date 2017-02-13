import React from 'react'
import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';

import * as Actions from '../actions/main_actions';

import loading from '../../../common/components/loading'

class CelltypeView extends React.Component {
    constructor(props) {
        super(props);
        this.state = { jq: null, isFetching: false, isError: false};
        this.loadGwas = this.loadGwas.bind(this);
    }

    componentDidMount(){
        this.loadGwas(this.props);
    }

    componentWillReceiveProps(nextProps){
        //console.log("componentWillReceiveProps", nextProps);
        this.loadGwas(nextProps);
    }

    loadGwas({gwas_study, cellType, actions}){
        var q = {GlobalAssembly, gwas_study, cellType};
        var jq = JSON.stringify(q);
        if(this.state.jq == jq){
            // http://www.mattzeunert.com/2016/01/28/javascript-deep-equal.html
            return;
        }
        //console.log("loadGene....", this.state.jq, jq);
        this.setState({jq, isFetching: true});
        $.ajax({
            url: "/gwasJson/accs",
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

    render() {
        if(!(this.props.gwas_study in this.state)){
            return loading(this.state);
        }
        let data = this.state[this.props.gwas_study];
	return (<div>
                <h3>{this.props.cellType.biosample_term_name}</h3>

		</div>);
    }
}

const mapStateToProps = (state) => ({ ...state });
const mapDispatchToProps = (dispatch) => ({
    actions: bindActionCreators(Actions, dispatch)
});
export default connect(mapStateToProps, mapDispatchToProps)(CelltypeView);
