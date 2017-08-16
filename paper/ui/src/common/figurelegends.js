let React = require('react');

export const FigureLegends = () => ([
    
    <span><b> | ENCODE Phase III data production as of February 1, 2017. a</b>, Human and <b>b</b>, Mouse ENCODE phase III experiments available on the ENCODE portal.
	Experiments are categorized by assay and biosample type: blue for immortalized cell line, red for tissue, teal for in vitro differentiated cells, orange for primary cells, purple for stem cells and pink for iPSCs.
    </span>,

    <span><b> | New assays used in ENCODE Phase III. a–b</b>, Using the 5' ends of RAMPAGE reads, we can identify TSSs and quantify tissue- and transcript-specific transcription.
        <b>a</b>, In testis, we identified a novel, tissue-specific TSS for <em>ARHGAP23</em> upstream of previous annotated TSSs. <b>b</b>, In spleen, we identified a novel TSS within exon 7 of <em>ARHGAP23</em>. 
        &nbsp;<b>c–d</b>, Integrative analyses of RBP data can identify genetic variants that may impact RBP regulation. <b>c</b>, Control and RBFOX2 knockdown RNA-seq of exons 65–67 of the <em>UTRN</em> gene in HepG2 cells. 
        Inclusion of the alternatively spliced exon 66 is reduced from 87% in control cells to 29% in RBFOX2 KD cells. 
        &nbsp;<b>d</b>, (right) A strong RBFOX2 eCLIP binding peak in the downstream intron is consistent with this splicing factor enhancing inclusion of the upstream alternative exon. 
        The minor allele of an ExAC SNP in the eCLIP peak in is expected to abrogate RBFOX2 binding as it abolishes the high affinity binding site determined from RNA Bind-n-Seq (RBNS). 
        (left) Effect of the ExAC variant on the RBFOX2 binding site as determined from RBNS data. 
        The G->C SNP in the eCLIP peak changes the most enriched 5-mer that likely mediates RBFOX2 binding (GCAUG R = 13.78) to a 5-mer with no detectable <em>in vitro</em> binding (CCAUG R = 0.89).
    </span>,

    <span><b> | Overview of the ENCODE Encyclopedia and prediction and validation of mouse embryonic enhancers. a</b>, Overview of the ENCODE Encyclopedia.
        The Encyclopedia consists of two levels (ground and integrative) which utilize data processed by the uniform processing pipelines. SCREEN integrates these data and annotations and allows users to visualize them on the UCSC genome browser.
        &nbsp;<b>b</b>, Validation rates of 151 enhancer-like regions tested using transgenic mouse assays.
        Dark color indicates the region was active in the predicted tissue while light color indicates a lack of activity in the predicted tissue but with activity in other tissues.
        &nbsp;<b>c–e</b>, Examples of enhancers (orange boxes) that were predicted based on DNase signal (green) and H3K27ac signal (orange) and validated in
        &nbsp;<b>c</b>, midbrain, <b>d</b>, hindbrain and <b>e</b>, limb. H3K27ac signal (yellow) in across tissues accurately predicts additional observed activity.
    </span>,

    <span><b> | Selection of cREs and assignment of cREs to nine states and five groups in a particular cell type. a</b>, Method for the section of cREs. We begin by clustering high quality DHSs (FDR > 0.1%) to create representative DHSs (rDHSs).
        For each assay (DNase, H3K4me3, H3K27ac or CTCF), we calculate a Z-score for every rDHS in a particular cell or tissue type. We then obtain the maximum Z-score across all cell types, known as the Max-Z.
        Using the Max-Z as well as the distance to the nearest TSS, we classify cREs into three cell-type agnostic groups using the decision tree: cREs with promoter-like signatures (n = 254,880),
        &nbsp;cREs with enhancer-like signatures (n = 991,173), and cREs bound by CTCF only (64,099). The total number of cREs is the sum of the three groups: 1,310,152.
        &nbsp;<b>b</b>, Given a cell type (shown for GM12878), we assign cREs into nine states based on whether they have high Z-scores (> 1.64) for H3K4me3, H3K27ac, CTCF, and DNase in that cell type.
        Each cRE is either proximal (≤ 2 kb) or distal (> 2 kb) to the nearest GENCODE-annotated TSS, and the bar graph shows the tally for each state in GM12878. Icons mark the states to the left of the bars.
        Colored boxes (for proximal cREs) and pies (for distal cREs) represent high Z-scores while white ones represent low Z-scores. <b>c</b>, Assignment of cRE states to five groups: with promoter-like signatures,
        &nbsp;with enhancer-like signatures, CTCF-only, DNase-only, and inactive. The bar plot shows the median ChIP-seq signal for POL2, EP300 and RAD21 in GM12878 for cREs in each category.
    </span>,

    <span><b> | Overview of SCREEN. a</b>, SCREEN’s cRE-centric search view. Using the facets on the main search page (top), the user can retrieve cREs (center) by genomic coordinates and activity profiles in a particular cell type;
        &nbsp;here, two cREs active in K562 are shown on chromosome 11. Both cREs are marked with blue stars, indicating that they have high DNase and high H3K4me3, H3K27ac, or CTCF in the same cell type, i.e., they have "concordant" support.
        The top cRE is marked with a "P", indicating that it is promoter-proximal (within 2 kb of an annotated promoter); the bottom cRE is marked with a “D” for promoter-distal. Four colors correspond to high values (>1.64) for the four epigenetic signals:
        &nbsp;DNase (green), H3K4me3 (red), H3K27ac (yellow), CTCF (blue). Gray indicates a Z-score below 1.64 for the given mark. The cRE details view shows neighboring genes, bound transcription factors,
        &nbsp;and mini-peaks epigenetic signals (bottom left, shown here for the top cRE in the search table). A trackhub is custom built for visualizing a cRE or a gene and the supporting data using the UCSC genome browser
        &nbsp;(bottom right, top cRE from the table highlighted in blue). <b>b</b>, SCREEN’s gene-centric view provides RNA-seq and RAMPAGE derived expression levels for the genes and TSSs near the cRE of interest.
        &nbsp;<b>c</b>, SCREEN’s SNP-centric view displays cREs that overlap SNPs from published GWAS studies and lends insight into which cell types may be relevant to a particular phenotype.
        The top two cell types are shown for an inflammatory bowel disease GWAS study, along with two cREs active in CD4+ T-cells which contain SNPs from the study.
    </span>,

    <span><b> | Analyzing differential gene expression and cRE activity across developmental time points. a</b>, Comparison between Limb e11.5 and e15.5 gene expression and cRE activity.
        Blue bars indicate differentially expressed genes while red and yellow dots indicate cREs promoter-like and enhancer-like signatures. The heights of bars or dots indicate changes (log<sub>2</sub> FC or difference in Z-score) between time points.
        &nbsp;<b>b</b>, Genome browser view of the <em>Ogn</em> locus with H3K27ac, H3K4me4, DNase, and RNA-seq signals for the limb across all surveyed time points. Promoter-like cREs are designated by red bars and enhancer-like cREs are designated by orange bars.
        &nbsp;<b>c</b>, <em>Ogn</em> gene expression and nearby cRE activity increase coordinately across time points. The increase in gene expression lags behind the increases in cRE-PLS and cRE-ELS activities. 
    </span>,

    <span><b> | Annotating GWAS variants using SCREEN. a</b>, The user can select from a preloaded list of GWAS. For each study, we included all tagged SNPs it reported and all SNPs in LD with them (<em>r<sup>2</sup></em> > 0.7).
        &nbsp;<b>b</b>, SCREEN reports the percent of LD blocks of a GWAS with at least one SNP overlapping a cRE. <b>c</b>, SCREEN ranks cell and tissue types based on enrichment in H3K27ac signals.
        The top 5 cell and tissue types are displayed here for each study. <b>d</b>, The user can narrow the search by selecting a cell type, such as GM12878 for multiple sclerosis (MS), and analyze the overlapping cREs.
        &nbsp;<b>e</b>, Zoomed in genome browser view of MS-associated SNP rs1250568, which overlaps an ELF1 ChIP-seq peak (blue box) and an ELF1 motif.
        &nbsp;<b>f</b>, Zoomed out genome browser view of the locus showing POL2 ChIA-PET links between rs1250568 and two genes <em>ZMIZ1</em> and <em>PPIF</em>.
    </span>,

    <span><b> | Fine mapping GWAS variants using SCREEN. a</b>, H3K4me3 and H3K27ac Z-scores for cREs containing SNPs in LD with the schizophrenia-associated SNP rs13025591.
        H3K4me3 Z-scores and H3K27ac Z-scores are displayed in red and yellow, for cREs with promoter-like and enhancer-like signatures respectively. <b>b</b>, SCREEN's Activity Profile tool allows the user to view DNase peaks at cREs across all cell types.
	Both the human cRE EH37E0579839 and its orthologous mouse cRE EM10E0042440 show high DNase signals in developing brain and eye tissues. <b>c</b>, H3K27ac signal at EM10E0061453 over developmental time in mouse forebrain (red), midbrain (green)
	&nbsp;and hindbrain (blue). <b>d</b>, Zoomed-in view of EH37E0579839. The SNP rs13031349 overlaps both EH37E0579839 and the orthologous mouse cRE EM10E0042440.
	The SNP also overlaps an SP3 motif, resulting in a change in the motif score.
    </span>

]);
