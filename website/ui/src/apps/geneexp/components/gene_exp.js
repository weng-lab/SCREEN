import React from 'react'
import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';
import { Button } from 'react-bootstrap';

import * as Actions from '../actions/main_actions';
import * as ApiClient from '../../../common/api_client';

import LargeHorizontalBars from '../components/large_horizontal_bars'
import loading from '../../../common/components/loading'
import HelpIcon from '../../../common/components/help_icon';
import ControlBar from './control_bar';

class GeneExp extends React.Component{
    constructor(props) {
        super(props);
	let gene = props.gene;
	if("genes" in props){
	    if(props.genes.length > 0){
		gene = props.genes[0].approved_symbol;
	    }
	}
	
        this.state = {jq: null, isFetching: true, isError: false,
		      width: 0,
		      isSingle: false,
		      sortOrder: "byTissue",
		      dataScale: "logTPM",
		      gene
	};
	
        this.doRenderWrapper = this.doRenderWrapper.bind(this);
        this.loadGene = this.loadGene.bind(this);
	this.updateWidth = this.updateWidth.bind(this);
	this.makeBrowserButton = this.makeBrowserButton.bind(this);
    }

    componentDidMount(){
	this.updateWidth();
        this.loadGene(this.props);
    }

    componentWillReceiveProps(nextProps){
	this.updateWidth();
        this.loadGene(nextProps);
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
		   gene: this.state.gene,
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
				this.setState({[jq]: r,
					       // gene: r.gene, FIXME!
					       isFetching: false, isError: false});
			    },
			    (msg) => {
				console.log("err loading ge");
				this.setState({jq: null, isFetching: false, isError: true});
			    });
    }

    makeBrowserButton(gbName) {
	return <Button bsSize="small"
		       onClick={() => {
			       const q = this.makeKey(this.props);
			       const jq = JSON.stringify(q);
			       if(jq in this.state){
				   const d = this.state[jq];
				   const gbq = {
				       accession: [],
				       title: d.gene,
				       start: d.start,
				       len: d.stop - d.start,
				       chrom: d.chrom
				   };
				   this.props.actions.showGenomeBrowser(gbq, gbName, "gene");
			       }
		       }}>
	    {gbName}
	</Button>;
    }
    
    doRenderWrapper(){
	const barheight = "15";
	const q = this.makeKey(this.props);
        const jq = JSON.stringify(q);
        if(jq in this.state){
	    //console.log("jq in state");
	    const data = this.state[jq];
            return (
		<div style={{"width": "100%"}} ref="bargraph">
		    {this.state.width > 0 &&
		     React.createElement(LargeHorizontalBars,
					 {...this.props,
					  ...this.state,
					  ...data,
					  width: this.state.width,
					  barheight})}
		</div>);
        }
	//console.log("jq NOT in state", q, "state:", this.state);
        return loading(this.state);
    }

    render(){
	const changeView = (isSingle, sortOrder, dataScale) => {
	    this.setState({isSingle, sortOrder, dataScale});
	}
	
        return (
	    <div ref="box" style={{"width": "100%"}} >
		<div>
		    <h4>
			<em>{this.state.gene}</em>
			{" Gene Expression Profiles by RNA-seq"}
			<HelpIcon globals={this.props.globals} helpkey={"GeneExpression"} />
			<span style={{paddingLeft: "20px"}}>
			    {this.makeBrowserButton("UCSC")}
			</span>
		    </h4>
		    <em>{this.props.ensemblid_ver}</em>
		</div>
		<ControlBar biosample_types_selected={this.props.biosample_types_selected}
		compartments_selected={this.props.compartments_selected}
		globals={this.props.globals}
		actions={this.props.actions}
		dataScale={this.state.dataScale}
		sortOrder={this.state.sortOrder}
			    isSingle={this.props.isSingle}
			    assembly={this.props.assembly}
		changeView={changeView}
		/>
		{this.doRenderWrapper()}
	    </div>);
    }
}

const mapStateToProps = (state) => ({ ...state });
const mapDispatchToProps = (dispatch) => ({
    actions: bindActionCreators(Actions, dispatch)
});
export default connect(mapStateToProps, mapDispatchToProps)(GeneExp);
