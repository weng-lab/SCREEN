import React from 'react'
import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';

import AutocompleteBox from './autocompletebox'

import * as Actions from '../actions';
import {tabPanelize} from '../../../common/utility'

class TabMain extends React.Component {
    constructor(props) {
	super(props);
        this.key = "main";
    }
    
    textBox() {
	return (
            <div className="container">

                <div className="row">
                    <div className="col-md-12">
		        SCREEN is a web interface for searching and visualizing the Registry of
			candidate Regulatory Elements (cREs) derived from <a href={"https://encodeproject.org/"} target={"_blank"}>ENCODE data</a>.
		        The Registry contains 1.31M human cREs in hg19 and 0.52M mouse cREs in mm10,
			with orthologous cREs cross-referenced.  SCREEN presents the data that support
			biochemical activities of the cREs and the expression of nearby genes in
			specific cell and tissue types.
                    </div>
                </div>

                <div className="row"><br />
                </div>

                <div className="row">
                    <div className="col-md-8">
                        You may launch SCREEN using the search box below or browse a curated list of
			SNPs from the NHGRI-EBI Genome Wide Association Study (GWAS) catalog to annotate genetic variants using cREs.
                    </div>
                    <div className="col-md-4">
		        <a className={"btn btn-primary mainButtonGwas"}
                           href={"/gwasApp/hg19/"} role={"button"}>
		            {"Browse GWAS"}
		        </a>
		    </div>
                </div>

        </div>);
    }
    
    shouldComponentUpdate(nextProps, nextState) {
        return this.key === nextProps.maintabs_active;
    }

    logo(){
	return (<img
                    className={"img-responsive mainLogo"}
                    src={"/static/encode/classic-image3.jpg"}
                    alt={"ENCODE logo"} />);
    }

    searchBox() {
	let examples = 'Examples: "K562 chr11:5226493-5403124", "SOX4 TSS", "rs4846913"';
	let dv = "K562 chr11:5226493-5403124";
	return (<div>
		    <AutocompleteBox defaultvalue={dv} actions={this.props.actions}
		        id="mainSearchbox" examples={examples} />
	        </div>);
    }
    
    render() {
        if(this.key !== this.props.maintabs_active){
	    return false;
	}
	return (tabPanelize(
            <div>

	        <div className={"row vertical-align"}>
		    <div className={"col-md-6"}>
		        {this.logo()}
		    </div>
		    <div className={"col-md-6"}>
		        <div className={"jumbotron"} id={"mainDesc"}>
		            {this.textBox()}
		        </div>
		    </div>
	        </div>

	        <div className={"row"}>
		    <div className={"col-md-12 text-center"}>
		        {this.searchBox()}
		    </div>
	        </div>

	    </div>));
    }
}

const mapStateToProps = (state) => ({ ...state });
const mapDispatchToProps = (dispatch) => ({
    actions: bindActionCreators(Actions, dispatch)
});
export default connect(mapStateToProps, mapDispatchToProps)(TabMain);
