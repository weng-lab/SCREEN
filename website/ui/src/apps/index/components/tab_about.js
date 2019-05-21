import React from 'react'

import * as Para from './tab_about_paragraphs';
import {tabPanelize} from '../../../common/utility'

class TabAbout extends React.Component {
    constructor(props) {
	super(props);
        this.key = "about"
    }

    shouldComponentUpdate(nextProps, nextState) {
        return this.key === nextProps.maintabs_active;
    }

    render() {
        if(this.key !== this.props.maintabs_active){
	    return false;
	}
        let content = (
            <div>
                <div className="row">
                    <div className="col-md-12">
                        <h3>The ENCODE Encyclopedia</h3>
                        {Para.figure(1, "ENCODE data levels",
                                     {maxHeight: "500px"})}
                    </div>
                    <div className="col-md-6">
                        <br />
                        {Para.intro()}
                    </div>
                </div>
                <div className="row">
                    <div className="col-md-6">
		        <h3>The Registry of candidate cis-Regulatory Elements</h3>
		    </div>
		</div>	    
                <div className="row">
                    <div className="col-md-6">
		        {Para.registry1()}
                    </div>
                    <div className="col-md-6">
                        {Para.figure(2, "genome browser")}
                    </div>
                </div>
                <div className="row">
                    <div className="col-md-6">
                        {Para.registry2()}
		        {Para.registry3()}
                    </div>
                    <div className="col-md-6">
                        {Para.figure(3, "flowchart")}
                    </div>
                </div>
                <div className="row">
                    <div className="col-md-6">
		        <h3>Classification of cCREs</h3>
                    </div>
                </div>
                <div className="row">
                    <div className="col-md-6">
		        {Para.classif1()}
			{Para.classif2()}
			{Para.classif3()}
		    </div>
		</div>
		<div className="row">
                    <div className="col-md-6">
		        <h3>Genomic Footprint of the cCREs</h3>
                    </div>
                </div>
                <div className="row">
                    <div className="col-md-6">
		        {Para.genomicFootprint()}
		    </div>
		    <div className="col-md-6">
			{Para.figure(4, "mappable")}
                    </div>
		</div>
		<div className="row">
                    <div className="col-md-6">
			<h3>Comprehensiveness of the Current Registry of cCREs</h3>
		    </div>
		</div>
                <div className="row">
                    <div className="col-md-6">
			{Para.comprehensiveness1()}
			{Para.comprehensiveness2()}
			{Para.comprehensiveness3()}
			{Para.comprehensiveness4()}
		    </div>
		    <div className="col-md-6">
			{Para.figure(5, "venn")}
                    </div>
		</div>

		<div className="row">
                    <div className="col-md-6">
			<h3>Genomic Context</h3>
		    </div>
		</div>
                <div className="row">
                    <div className="col-md-6">
		        {Para.genomicContext()}
		    </div>
                    <div className="col-md-6">
			{Para.figure(6, "venn")}
                    </div>
		</div>

		<div className="row">
                    <div className="col-md-6">
			<h3>Other Histone Modifications and Transcription Factor Occupancy</h3>
		    </div>
		</div>
                <div className="row">
                    <div className="col-md-6">
		        {Para.occupancy1()}
		    </div>
		</div>
		
		<div className="row">
                    <div className="col-md-6">
	                <h3>Using cCREs to Interpret GWAS Variants</h3>
		    </div>
		</div>
                <div className="row">
                    <div className="col-md-6">
                        <h4>Curating GWAS Results</h4>
                        {Para.gwas1()}
                        <h4>Determining Cell Types with cCREs Enriched in GWAS SNPs</h4>
                        {Para.gwas2()}
		    </div>
		</div>
		
                <div className="row">
                    <div className="col-md-6">
			<h3>How to Cite the ENCODE Encyclopedia, the Registry of cCREs, and SCREEN</h3>
		    </div>
		</div>
                <div className="row">
		    <div className="col-md-6">
			{Para.citation()}
                    </div>
        	</div>
		
            </div>);
	
        return (tabPanelize(
            <div>
                {content}
            </div>));
    }
}

export default TabAbout;
