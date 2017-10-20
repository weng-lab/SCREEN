import React from 'react'
import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';
import { Button } from 'react-bootstrap';

import * as Actions from '../actions/main_actions';
import * as ApiClient from '../../../common/api_client';

import LargeHorizontalBars from '../components/large_horizontal_bars'
import loading from '../../../common/components/loading'
import HelpIcon from '../../../common/components/help_icon';

class GeneExp extends React.Component{
    constructor(props) {
        super(props);
        this.state = {jq: null, isFetching: true, isError: false,
		      width: 0};
        this.doRenderWrapper = this.doRenderWrapper.bind(this);
        this.loadGene = this.loadGene.bind(this);
	this.updateWidth = this.updateWidth.bind(this);
    }

    componentDidMount(){
	this.updateWidth();
        this.loadGene(this.props);
    }

    componentWillReceiveProps(nextProps){
	this.updateWidth();
        this.loadGene(nextProps);
    }

    _bb(gbName) {
	return <Button bsSize="xsmall" 
		       onClick={() => {
			       const q = {
				   accession: [],
				   title: this.props.gene,
				   start: this.props.data.coords.start,
				   len: this.props.data.coords.len,
				   chrom: this.props.data.coords.chrom
			       };
			       this.props.actions.showGenomeBrowser(q, gbName, "gene");
		       }}>
	    {gbName}
	</Button>;
    }
    
    updateWidth(){
	if(this.refs.box){
	    const width = Math.max(1200, this.refs.box.clientWidth);
	    this.setState({width});
	}

    }
    
    makeKey(p){
	const r = {assembly: p.assembly,
		   accession: p.cre_accession_detail,
		   gene: p.gene,
		   compartments_selected: Array.from(p.compartments_selected),
                   biosample_types_selected: Array.from(p.biosample_types_selected)};
	return r;
    }
    
    loadGene(p){
	const q = this.makeKey(p);
        const jq = JSON.stringify(q);
	if(jq in this.state){
	    return;
	}
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
				this.setState({jq: null, isFetching: false, isError: true});
			    });
    }

    doRenderWrapper(){
	const barheight = "15";
	const q = this.makeKey(this.props);
        const jq = JSON.stringify(q);
        if(jq in this.state){
	    const data = this.state[jq];

            return (
		<div>
 	            <span style={{fontSize: "18pt"}}>
			<em>{this.props.gene}</em> {this._bb("UCSC")}
			<HelpIcon globals={this.props.globals} helpkey={"GeneExpression"} />
                    </span>
		    <div style={{"width": "100%"}} ref="bargraph">
			{this.state.width > 0 &&
			 React.createElement(LargeHorizontalBars,
					     {...this.props,
					      ...data,
					      width: this.state.width,
					      barheight})}
		    </div>
		</div>);
        }
        return loading(this.state);
    }

    render(){
        return (
	    <div ref="box" style={{"width": "100%"}} >
		{this.doRenderWrapper()}
            </div>);
    }
}

const mapStateToProps = (state) => ({ ...state });
const mapDispatchToProps = (dispatch) => ({
    actions: bindActionCreators(Actions, dispatch)
});
export default connect(mapStateToProps, mapDispatchToProps)(GeneExp);
