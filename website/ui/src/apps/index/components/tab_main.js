import React from 'react'
import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';

import Autocompleter from './autocompleter'
import * as ApiClient from '../../../common/api_client';
import * as Actions from '../actions';
import {tabPanelize} from '../../../common/utility'

let root = '/' + process.env.PUBLIC_URL.split('/').slice(3).join('/');

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
			candidate cis-Regulatory Elements (ccREs) derived from <a href={"https://encodeproject.org/"} target={"_blank"}>ENCODE data</a>.
		        The Registry contains 1.31M human ccREs in hg19 and 0.43M mouse ccREs in mm10,
			with homologous ccREs cross-referenced.  SCREEN presents the data that support
			biochemical activities of the ccREs and the expression of nearby genes in
			specific cell and tissue types.
                    </div>
                </div>

                <div className="row"><br />
                </div>

                <div className="row">
                    <div className="col-md-8">
                        You may launch SCREEN using the search box below or browse a curated list of
			SNPs from the NHGRI-EBI Genome Wide Association Study (GWAS) catalog to annotate genetic variants using ccREs.
                    </div>
                    <div className="col-md-4">
		        <a className={"btn btn-primary mainButtonGwas"}
                           href={root + "/gwasApp/?assembly=hg19"} role={"button"}>
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
	return (<img className={"img-responsive mainLogo"}
                src={ApiClient.StaticUrl("/encode/classic-image3.jpg")}
                alt={"ENCODE logo"} />);
    }

    searchBox() {
	let instructions = "Enter a gene name or alias, a SNP rsID, a ccRE accession, or a genomic region in the form chr:start-end. You may also enter a cell type name to filter results."
	let examples = 'Examples: "K562 chr11:5205263-5381894", "SOX4", "rs4846913", "EH37E0204974"';
	let dv = "chr11:5205263-5381894";
	return (
	    <Autocompleter defaultvalue={dv}
	    uuid={this.props.uuid}
	    actions={this.props.actions}
		           id="mainSearchbox"
	    examples={examples} instructions={instructions} />);
    }
    
    render() {
        if(this.key !== this.props.maintabs_active){
	    return false;
	}
	return (tabPanelize(
            <div>

	        <div className={"row vertical-align hidden-sm hidden-xs"}>
		    <div className={"col-md-6"}>
		        {this.logo()}
		    </div>
		    <div className={"col-md-6"}>
		        <div className={"jumbotron"} id={"mainDesc"}>
		            {this.textBox()}
		        </div>
		    </div>
	        </div>

	    	<div className={"row vertical-align hidden-md hidden-lg hidden-xl"}>
		    <div className={"col-xs-12"}>
		        <div className={"jumbotron"} id={"mainDesc"}>
		            {this.textBox()}
		        </div>
		    </div>
	        </div>

	    	<div className={"row vertical-align hidden-md hidden-lg hidden-xl"}>
		    <div className={"col-xs-12"}>
		        {this.logo()}
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
