import React from 'react'

import {Tabs, Tab} from 'react-bootstrap'
import {tabPanelize} from '../../../common/utility'
import ASHG from './tab_ashg_2017'

class UTabUCSC extends React.Component {
    render() {
	return tabPanelize(
		<div>
		<h2>Introduction</h2>
		<p>SCREEN and the ENCODE Encyclopedia are deeply integrated with the UCSC Genome Browser, in order to facilitate genome-wide visualization of all of the Encyclopedia’s annotations. All ground-level and integrative-level annotations have been packaged into Genome Browser tracks. If you would like to navigate through these tracks annotations yourself using the UCSC Genome Browser, you may do so using the large ENCODE Encyclopedia trackhub hosted at UCSC, which provides access to all the Encyclopedia’s annotations. This approach is described below in the Encyclopedia Trackhub section. If you prefer to identify regions of interest using SCREEN and then visualize these regions in the UCSC Genome Browser, you may use SCREEN’s customizable trackhub feature, which allows you to select custom subsets of the Encyclopedia’s data on-the-fly within SCREEN and visualize them within regions of interest. This approach is described in the Dynamically-generated trackhubs section below.</p>
		<h2>Dynamically-generated Trackhubs</h2>
		<p>SCREEN provides numerous entry points to the UCSC Genome Browser. Nearly everywhere a genomic feature with genomic coordinates is presented on SCREEN, an accompanying UCSC Genome Browser button is available, which leads to a view of the surrounding genomic neighborhood in the UCSC Genome Browser. Examples of features with associated UCSC Genome Browser buttons include ccREs, genes, RAMPAGE TSSs, and annotations from external datasets such as the FANTOM Consortium’s catalogs. The locations of these UCSC Genome Browser buttons are presented in <strong>Figure 1</strong>.</p>
		<em><strong>Figure 1</strong>. Locations of UCSC Genome Browser buttons in the main search table (top left), RNA-seq expression view (top right), RAMPAGE expression view (bottom left), and FANTOM intersection view (bottom right).</em><br/><br/>
		<p>Clicking a UCSC Genome Browser button will bring you to a Genome Browser Configuration view, which allows you to select which data you are interested in viewing in the region surrounding your feature of interest. An example of this view is shown in <strong>Figure 2</strong>. The configuration view displays the coordinates of the selected feature at the top; when the genome browser is opened, it will be centered on these coordinates, expanded in 7,500bp upstream and downstream.</p>
		<em><strong>Figure 2</strong>. <strong>a</strong>, Genome Browser configuration view, showing a selected ccRE with coordinates, the 5-group/9-state toggle buttons with 5-group selected, and the cell type selector with four biosamples selected. <strong>b</strong>, handles for rearranging cell type order highlighted in red.</em><br/><br/>
		<p>The default view includes cell type-agnostic ccRE tracks; you may select whether to view a single track of 5-group classifications or an expanded set of three 9-state classification tracks, one for each H3K4me3, H3K27ac, and CTCF, using the 5-group/9-state toggle buttons. ccREs within the five group track will be either red for promoter-like, yellow for enhancer-like, blue for CTCF-bound, or gray for inactive; ccREs within the 9-state tracks will be colored if the corresponding Z-score is greater than 1.64 and will be gray otherwise.</p>
		<p>Next, you may use the cell type selector to add tracks for individual cell types to your visualization. Selecting a cell type will add the cell type’s ccRE tracks; the 5-group/9-state selection you made above will apply to these tracks too. Signal tracks for DNase-seq, H3K4me3 ChIP-seq, H3K27ac ChIP-seq, CTCF ChIP-seq, and RNA-seq will also be added when they are available. The colored box to the right of the cell type name shows which of the four core epigenomic marks have signal available for the given cell type, and a check mark in the rightmost RNA-seq column indicates that a cell type has RNA-seq signal available.</p>
		<p>Clicking a cell type will add it to the Selected Biosamples list. If you would like to rearrange the order in which the cell type tracks appear in the UCSC genome browser before you open it, you may do so by clicking the handles to the left of the cell type names and dragging the cell types up or down; these handles are highlighted in <strong>Figure 2b</strong>. When you are content with your selections, click the Open in UCSC button to open the Genome Browser.</p>
		<p>Part of the Genome Browser view for the selection in <strong>Figure 2a</strong> is shown in <strong>Figure 3</strong>. The selected ccRE is highlighted in blue at the center of the screen. The view shows General, or cell type-agnostic, ccREs on top, followed by ccRE activity and the available DNase-seq and RNA-seq data for A172, and then the ccRE activity and the available histone mark ChIP-seq data for ACC112. You may further customize your view with additional tracks from the Encyclopedia Trackhub if desired, as described below.</p>
		<em><strong>Figure 3</strong>. Part of the genome browser view for the selection in <strong>Figure 2</strong>, showing cell type-agnostic ccREs (top) and data for A172 and ACC112.</em><br/><br/>
		<h2>Encyclopedia Trackhub</h2>
		</div>
	);
    }
}

class UTabTutorial extends React.Component {
    constructor(props) {
	super(props);
        this.key = "tutorial"
    }

    shouldComponentUpdate(nextProps, nextState) {
        return this.key === nextProps.maintabs_active;
    }

    render() {
        if(this.key !== this.props.maintabs_active){
	    return false;
	}
	const Iframe = (url) => (
            <iframe width="560" height="315"
	            src={url}
		    title={url}
	            frameBorder="0" allowFullScreen>
	    </iframe>);
	    
	return (tabPanelize(
            <div>
                <h2>Tutorials</h2>
                <h3>Main Search</h3>
                {Iframe("https://www.youtube.com/embed/gOS7Eyi0xvM")}

	        <h3>Search Results Table</h3>
		{Iframe("https://www.youtube.com/embed/tOUJJ1L1E20")}

		<h3>ccRE Details</h3>
                {Iframe("https://www.youtube.com/embed/58U6k86vz2U")}

                <h3>Gene Expression</h3>
		{Iframe("https://www.youtube.com/embed/D6dxzSX2XTE")}
		
	        <h3>Differential Gene Expression</h3>
		{Iframe("https://www.youtube.com/embed/KzsuZ8oGxZk")}

	        <h3>GWAS</h3>
		{Iframe("https://www.youtube.com/embed/eunBo1-yF9M")}

	        <h3>Mini-Peaks (ccRE signal profile)</h3>
		{Iframe("https://www.youtube.com/embed/IMHOTf-rG1Q")}
		
	    </div>));
    }
}

class TabTutorial extends React.Component {

    constructor(props) {
	super(props);
	this.key = "tutorial";
    }

    render() {
	return (
		<Tabs defaultActiveKey={1} id="tabset">
		  <Tab eventKey={1} title="Videos">
		    <UTabTutorial {...this.props} />
                  </Tab>
		  <Tab eventKey={2} title="UCSC Genome Browser">
		    <UTabUCSC {...this.props} />
		  </Tab>
	          <Tab eventKey={3} title="ASHG 2017">
		    <ASHG {...this.props} />
		  </Tab>
		</Tabs>
	);
    }
    
}
export default TabTutorial;
