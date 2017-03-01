import React from 'react'

import * as Para from './tab_about_paragraphs';

class TabAbout extends React.Component {
    render() {
        let content = (
            <div>
                <div className="row">
                    <div className="col-md-12">
                        <h3>The ENCODE Encyclopedia</h3>
		        <div className="text-center">
			    <img src="/static/about/images/aimage04.png"
                                 className={"img-responsive"}
                                 alt={"ENCODE data levels"}
			         style={{maxHeight: "500px"}}
                            />
		        </div>
		        {Para.intro()}
                    </div>
	        </div>

	        <div className="row">
                    <div className="col-md-8">
		        <h3>The Registry of candidate Regulatory Elements</h3>
		        {Para.registry1()}
		        {Para.registry2()}
		        {Para.registry3()}
		        {Para.registry4()}
		        <h3>Annotating candidate Regulatory Elements</h3>
		        <h4>Genomic Context</h4>
		        {Para.genomicContext()}
		        <h4>Histone Modifications and Transcription Factor Occupancy</h4>
		        {Para.occupancy1()}
		        {Para.occupancy2()}
                        <h3>Using cREs to Interpret Variants Identified by Genome-wide Association Studies</h3>
                        <h4>Curating GWAS Results</h4>
                        {Para.gwas1()}
                        <h4>Determining Enriched Cell Types </h4>
                        {Para.gwas2()}

                        <h3>How to Cite the ENCODE Encyclopedia, the Registry of cREs, and SCREEN</h3>
                        <ul>
                            <li>ENCODE Project Consortium, Bernstein BE, Birney E, Dunham I, Green ED, Gunter C, Snyder M. 2012. An integrated encyclopedia of DNA elements in the human genome. Nature 489: 57–74.</li>
                            <li>ENCODE Project Consortium, Myers RM, Stamatoyannopoulos J, Snyder M, Dunham I, Hardison RC, Bernstein BE, Gingeras TR, Kent WJ, Birney E, et al. 2011. A user's guide to the encyclopedia of DNA elements (ENCODE). PLoS Biol 9: e1001046.</li>
                        </ul>
                    </div>
                    <div className="col-md-4">
		        <img src="/static/about/images/aimage01.png"
                             className={"img-responsive"}
                             alt={"pie chart"} />
		        <img src="/static/about/images/aimage03.png"
                             className={"img-responsive"}
                             alt={"pie chart"} />
		        <img src="/static/about/images/aimage00.png"
                             className={"img-responsive"}
                             alt={"UCSC data tracks"} />
		        <img src="/static/about/images/aimage06.png"
                             className={"img-responsive"}
                             alt={"pie chart"} />
		        <img src="/static/about/images/aimage05.png"
                             className={"img-responsive"}
                             alt={"pie chart"} />
		        <img src="/static/about/images/aimage02.png"
                             className={"img-responsive"}
                             alt={"pie chart"} />
                    </div>
	        </div>
            </div>);

        return (
            <div>
                {content}
            </div>);
    }
}

export default TabAbout;
