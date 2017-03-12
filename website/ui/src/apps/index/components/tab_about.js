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
		        <h3>The Registry of candidate Regulatory Elements</h3>
		        {Para.registry1()}
		        {Para.registry2()}
		        {Para.registry3()}
		        {Para.registry4()}
		        {Para.registry5()}
		        <h3>Annotating candidate Regulatory Elements</h3>
		        <h4>Genomic Context</h4>
		        {Para.genomicContext()}
		        <h4>Other Histone Modifications and Transcription Factor Occupancy</h4>
		        {Para.occupancy1()}
	                <h3>Using cREs to Interpret Variants Identified by Genome-wide Association Studies (GWAS)</h3>
                        <h4>Curating GWAS Results</h4>
                        {Para.gwas1()}
                        <h4>Determining Cell Types with cREs Enriched in GWAS SNPs
</h4>
                        {Para.gwas2()}

                        <h3>How to Cite the ENCODE Encyclopedia, the Registry of cREs, and SCREEN</h3>
                        {Para.citation()}
                    </div>
                    <div className="col-md-6">
                        {Para.figure(2, "genome browser")}
                        {Para.figure(3, "flowchart")}
                        {Para.figure(4, "pie chart")}
                        {Para.figure(6, "pie chart 2")}
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
