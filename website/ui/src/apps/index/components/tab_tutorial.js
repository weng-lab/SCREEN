import React from 'react'

import {tabPanelize} from '../../../common/utility'

class UTabUCSC extends React.Component {
    render() {
	return tabPanelize(
		<div>
		<h2>Introduction</h2>
		<p>SCREEN and the ENCODE Encyclopedia are deeply integrated with the UCSC Genome Browser to facilitate genome-wide visualization of all of the Encyclopedia’s annotations. You can visualize all ground-level anotations from the Encylcopedia using our "mega-trackhub", which contains peaks and signal for all the core DNA-based and RNA-based assays available at ENCODE as well as integrative annotations related to the Registry of cCREs. Alternatively, SCREEN offers the capability to generate customized trackhubs with cCRE-related data including DNase-seq, H3K4me3 ChIP-seq, H3K27ac ChIP-seq, CTCF ChIP-seq, and RNA-seq. Select a tab below for more information or to access the mega-trackhub.</p>
		<h2>Mega trackhubs</h2>
		We offer mega trackhubs for human and mouse which provide access to all the ground level data in the ENCODE Encyclopedia. These mega hubs are divided into three hubs for each species: a DNA-based hub, containing assays targeting DNase accessibility, DNA binding by transcription factors, DNA methylation, and other DNA-related features; an RNA-based hub, containing assays targeting RNA expression, RNA binding protein occupancy, and other RNA-related features; and an integrative hub, containing cCREs and the epigenetic data used to derive them. Mouse hubs are available on the mm10 genome; human hubs are available both on hg19 and GRCh38.<br/><br/>
		You can use the buttons below to access the trackhubs at UCSC:<br/><br/>
                		        <a className={"btn btn-primary mainButtonGwas"}
                           href={"https://genome.ucsc.edu/cgi-bin/hgTracks?db=GRCh38&position=chr12:53380176-53416446&hubClear=http://screen.encodeproject.org/hubs/dna/hub.txt"} role={"button"}>
		            DNA
	    </a>&nbsp;		        <a className={"btn btn-primary mainButtonGwas"}
                           href={"https://genome.ucsc.edu/cgi-bin/hgTracks?db=GRCh38&position=chr12:53380176-53416446&hubClear=http://screen.encodeproject.org/hubs/rna/hub.txt"} role={"button"}>
		            RNA
	    </a>&nbsp;		        <a className={"btn btn-primary mainButtonGwas"}
                           href={"https://genome.ucsc.edu/cgi-bin/hgTracks?db=GRCh38&position=chr12:53380176-53416446&hubClear=http://screen.encodeproject.org/hubs/integrative/hub.txt"} role={"button"}>
		            Integrative
	    </a>
		<h2>Custom trackhubs in SCREEN</h2>
		    <p>Nearly everywhere a genomic feature with genomic coordinates is presented on SCREEN, an accompanying UCSC button is available, which leads to a view of the surrounding genomic neighborhood in the UCSC Genome Browser. Examples of features with associated UCSC Genome Browser buttons include cCREs, genes, RAMPAGE TSSs, and annotations from external datasets such as the FANTOM Consortium’s catalogs. The locations of these UCSC Genome Browser buttons are presented in <strong>Figure 1</strong>.</p>
		<img src="/assets/about/images/ucscfig1.png" alt="UCSC buttons" style={{ width: "80%" }} /><br />
		<em><strong>Figure 1</strong>. Locations of UCSC Genome Browser buttons in the main search table (top left), RNA-seq expression view (top right), RAMPAGE expression view (bottom left), and FANTOM intersection view (bottom right).</em><br/><br/>
		<p>Clicking a UCSC Genome Browser button will bring you to a Genome Browser Configuration view, which allows you to select which data you are interested in viewing in the region surrounding your feature of interest. An example of this view is shown in <strong>Figure 2</strong>. The configuration view displays the coordinates of the selected feature at the top; when the genome browser is opened, it will be centered on these coordinates, expanded 7,500 basepairs upstream and downstream.</p>
		<img src="/assets/about/images/ucscfig2.png" alt="UCSC configuration" style={{ width: "50%" }} /><br />
		<em><strong>Figure 2</strong>. The Genome Browser configuration view, showing a selected cCRE with coordinates, the cell type selector with four biosamples selected, and handles for rearranging cell type order highlighted in red.</em><br/><br/>
		   <p>The default view includes cell type-agnostic cCRE tracks; you may select whether to view a single track of 7-group classifications or an expanded set of three 9-state classification tracks, one for each H3K4me3, H3K27ac, and CTCF, using the 7-group/9-state toggle buttons. cCREs within the five group track will be either red for promoter-like, yellow for enhancer-like, blue for CTCF-bound, or gray for inactive; cCREs within the 9-state tracks will be colored if the corresponding Z-score is greater than 1.64 and will be gray otherwise.</p>
		   <p>Next, you may use the cell type selector to add tracks for individual cell types to your visualization. Selecting a cell type will add the cell type’s cCRE tracks; the 7-group/9-state selection you made above will apply to these tracks too. Signal tracks for DNase-seq, H3K4me3 ChIP-seq, H3K27ac ChIP-seq, CTCF ChIP-seq, and RNA-seq will also be added when they are available. The colored box to the right of the cell type name shows which of the four core epigenomic marks have signal available for the given cell type, and a check mark in the rightmost RNA-seq column indicates that a cell type has RNA-seq signal available.</p>
		   <p>Clicking a cell type will add it to the Selected Biosamples list. If you would like to rearrange the order in which the cell type tracks appear in the UCSC genome browser before you open it, you may do so by clicking the handles to the left of the cell type names and dragging the cell types up or down. When you are content with your selections, click the Open in UCSC button to open the Genome Browser.</p>
		<p>Part of the Genome Browser view for the selection in <strong>Figure 2</strong> is shown in <strong>Figure 3</strong>. The selected cCRE is highlighted in blue at the center of the screen. The view shows General, or cell type-agnostic, cCREs on top, followed by cCRE activity and the available DNase-seq and RNA-seq data for A172, and then the cCRE activity and the available histone mark ChIP-seq data for ACC112. You may further customize your view with additional tracks from the Encyclopedia Trackhub if desired, as described below.</p>
		<img src="/assets/about/images/ucscfig3.png" alt="browser view" style={{ width: "80%" }}/><br />
		   <em><strong>Figure 3</strong>. Part of the genome browser view for the selection in <strong>Figure 2</strong>, showing cell type-agnostic cCREs (top) and data for A172 and A549.</em>
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

	    	<h3>Mini-Peaks (cCRE signal profile)</h3>
		{Iframe("https://www.youtube.com/embed/btBh6x-mh1Q")}
	    
                <h3>Main Search</h3>
                {Iframe("https://www.youtube.com/embed/gOS7Eyi0xvM")}

	        <h3>Search Results Table</h3>
		{Iframe("https://www.youtube.com/embed/tOUJJ1L1E20")}

		<h3>cCRE Details</h3>
                {Iframe("https://www.youtube.com/embed/58U6k86vz2U")}

                <h3>Gene Expression</h3>
		{Iframe("https://www.youtube.com/embed/D6dxzSX2XTE")}
		
	        <h3>Differential Gene Expression</h3>
		{Iframe("https://www.youtube.com/embed/KzsuZ8oGxZk")}

	        <h3>GWAS</h3>
		{Iframe("https://www.youtube.com/embed/eunBo1-yF9M")}
		
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
		    <UTabTutorial {...this.props} />
	);
    }
    
}
export default TabTutorial;

class TabUCSC extends React.Component {

    constructor(props) {
	super(props);
	this.key = "ucsc";
    }

    render() {
	return (
		    <UTabUCSC {...this.props} />
	);
    }
    
}
export { TabUCSC };
