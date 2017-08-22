let React = require('react');

const Intro = () => (
    <div className="row">
      <div className="col-xs-12">	
	<h1><em>ENCODE Phase III: Building an Encyclopaedia of candidate Regulatory Elements for Human and Mouse</em></h1>
	<h2>Companion Site</h2><br/>
        <h3>Overview</h3>
        <p>Throughout its first three phases, the ENCODE Project has sought to map all functional elements of the human and mouse genomes. Progress toward this goal has involved numerous epigenomic experiments utilizing a wide array of assays. The most recent phase of the ENCODE Project, Phase III, saw a sizeable expansion in the breadth of cell types assayed and the depth of assays performed for each cell type (see Table 1, <em>Tables</em> tab). ENCODE experiments must satisfy the data production guidelines (see the <em>Data production guidelines</em> link, <em>Useful Links</em> section below); raw data produced by the experiments are available at the ENCODE portal (see the <em>Experiment matrix</em> link, <em>Useful Links</em> section below).</p>
        <p>The results of these experiments have been combined to form a catalog of epigenomic annotations termed the ENCODE Encyclopedia (see the <em>Encyclopedia information</em> link, <em>Useful Links</em> section below). The Encyclopedia includes a ground level, which contains low-level annotations for individual experiments produced by the ENCODE uniform processing pipeline (see the <em>Uniform Pipeline</em> link, <em>Useful Links</em> section below), and an integrated level, in which ground-level annotations across multiple experiments have been combined to produce higher-level annotations.</p>
        <p><em>ENCODE Phase III: Building an Encyclopaedia of candidate Regulatory Elements for Human and Mouse</em> describes the expansion of data production during ENCODE Phase III and introduces the Registry of Candidate Regulatory Elements (cREs), the core of the Encyclopedia’s integrated level. The cREs are a collection of DNase hypersensitivity sites for which regulatory function is supported by local histone modifications or CTCF binding. They are divided into groups, including enhancer-like, promoter-like, and CTCF-bound, on the basis of these epigenomic marks (see Figure 4, <em>Figures</em> tab).</p>
        <p>Searching and visualization of cREs within the Registry is made possible by SCREEN (Search Candidate Regulatory Elements by ENCODE), a web-based tool accessible at <a href="http://screen.umassmed.edu/">http://screen.umassmed.edu/</a>. SCREEN also presents gene expression data associated with the cREs and the intersection between SNPs from GWAS and the cREs, and facilitates visualization of both integrated and ground-level annotations using the UCSC genome browser. Together, these features represent a powerful tool for the generation of biological hypotheses using ENCODE data (see Figure 5, <em>Figures</em> tab).</p>

        <h3>How to use this site</h3>
        <p>This companion site provides useful links to information related to the ENCODE Encyclopedia and the cREs. In addition, the site provides rich, interactive versions of all published figures, supplementary figures, and tables from the Phase III paper. One of the most powerful features of SCREEN is that it can replicate many of these published figures, using not only the data and genomic regions presented in the Phase III paper but all other data and genomic regions cataloged by the Encyclopedia as well. To see this in action, simply click the <em>Figures</em> or <em>Extended Data Figures</em> tab above and then click the figure links at the top of the tab to select a figure of interest. Interactive figures will have a blue information box above them describing their interactive features; simply follow the instructions contained in the information boxes to see the corresponding views on SCREEN. Examples of interactive figures include Figures 5, 6, and 7.</p>

        <p>To browse tables from the Phase III manuscript, select the <em>Tables</em> tab at the top of the page. The tables may be sorted by clicking the column headers, and the values contained within the tables may be searched using the search boxes above the tables. All tables may also be downloaded in CSV format using the buttons above the tables.</p>
	<h3>Useful Links</h3>
        <h4><em>SCREEN links</em></h4>
        SCREEN homepage: <a href="http://screen.umassmed.edu">http://screen.umassmed.edu</a><br/>
        SCREEN GWAS: <a href="http://screen.umassmed.edu/gwasApp/hg19">http://screen.umassmed.edu/gwasApp/hg19</a><br/>

        <h4><em>ENCODE Portal</em></h4>
        Portal homepage: <a href="http://www.encodeproject.org/">http://www.encodeproject.org/</a><br/>
        Encyclopedia information: <a href="https://www.encodeproject.org/data/annotations/">https://www.encodeproject.org/data/annotations/</a><br/>
        Data production guidelines: <a href="https://www.encodeproject.org/about/experiment-guidelines/#guideline">https://www.encodeproject.org/about/experiment-guidelines/#guideline</a><br/>
        Uniform pipeline: <a href="https://www.encodeproject.org/pipelines/">https://www.encodeproject.org/pipelines/</a><br/>
        Experiment matrix: <a href="https://www.encodeproject.org/matrix/?type=Experiment">https://www.encodeproject.org/matrix/?type=Experiment</a><br/>
        Quality metrics: <a href="https://www.encodeproject.org/data-standards/, https://www.encodeproject.org/antibodies/">https://www.encodeproject.org/data-standards/, https://www.encodeproject.org/antibodies/</a><br/>
        GitHub: <a href="https://github.com/ENCODE-DCC">https://github.com/ENCODE-DCC</a><br/>

        <h4><em>Other links</em></h4>
        Factorbook: <a href="http://www.factorbook.org">http://www.factorbook.org</a><br/>
        RNA binding protein immunostaining: <a href="http://rnabiology.ircm.qc.ca/RBPImage/">http://rnabiology.ircm.qc.ca/RBPImage/</a><br/>
      </div>
    </div>
);
export default Intro;
