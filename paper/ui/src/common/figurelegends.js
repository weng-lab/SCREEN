let React = require('react');

export const FigureTitles = () => ([
    "ENCODE Phase III data production as of February 1, 2017",
    "New assays used in ENCODE Phase III",
    "Overview of the ENCODE Encyclopedia and prediction and validation of mouse embryonic enhancers",
    "Selection of cREs and assignment of cREs to nine states and five groups in a particular cell type",
    "Overview of SCREEN",
    "Analyzing differential gene expression and cRE activity across developmental time points",
    "Annotating GWAS variants using SCREEN",
    "Fine mapping GWAS variants using SCREEN"
]);

export const FigureHeaders = () => ([
    "", "", "", "", "Some links in this figure are interactive. Click the blue text to see corresponding views on SCREEN.",
    "The labels in this figure are interactive. Click 'a' or 'b' to see corresponding views on SCREEN and the UCSC Genome Browser.",
    "This figure is interactive. Click the GWAS citations at the top left to view them in SCREEN. Click the genome browser tracks on the right to view them in the UCSC Genome Browser.", ""
]);

export const ExtFigureHeaders = () => ([
    "", "", "",
    "This figure is interactive. Click the gene names and bar graphs to see the corresponding views on SCREEN.",
    "", "", "", "", "", "", "", "", "", "", "", "", "",
    "This figure is interactive. Click the gene names and bar graphs to see the corresponding views on SCREEN.",
    "This figure is interactive. Click the gene names and bar graphs to see the corresponding views on SCREEN.",
    "This figure is interactive. Click the gene names and bar graphs to see the corresponding views on SCREEN.",
    "", ""
]);

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

export const ExtendedLegends = () => ([

    <span><b> | RAMPAGE data signal at EP300.</b> RAMPAGE signals across six human tissues at EP300 demonstrate that both the GENCODE- and UCSC-annotated TSSs for EP300 are active.</span>,

    <span><b> | DNA replication timing (RT) programs of distinct human cell types.</b>
        Genome-wide RT programs were obtained for distinct human cell types, including embryonic stem cell (hESC)-derived, primary cells and established cell lines representing intermediate stages of endoderm, mesoderm, ectoderm, and neural crest development.
        Solid arrow lines depict the in vitro differentiation pathways of the distinct cell types from hESCs; dashed arrows depict the embryonic origin of the cell types not derived from hESCs (primary cells and cell lines).
        Dataset and protocol ENCODE IDs are shown in blue and brown for each cell type.
    </span>,
																			       
    <span><b> | DNA replication timing (RT) programs are cell type-specific. a</b>, Schematic diagram showing the three germ layers and the neural crest during the early stages of human development and differentiation pathways of the distinct cell types analyzed.
        &nbsp;<b>b</b>, Hierarchical clustering of RT programs from the distinct human cell types. Branches of the dendrogram were constructed based on the Pearson correlation coefficients between cell types (distance = 1 – correlation value).
        Clusters of cell types are indicated at the bottom: pluripotent, definitive endoderm (DE), liver and pancreas, neural crest and mesoderm cell types, neural precursors (NPC), myeloid and erythroid progenitors, and lymphoid cells.
        (NC) neural crest; (MED) mesendoderm; (DE) definitive endoderm; (LPM) lateral plate mesoderm; (Splanc) splanchnic mesoderm; (Mesothel) mesothelium; (SM) smooth muscle; (Myob) myoblasts; (Fibrob) fibroblasts; (MSC) mesenchymal stem cells; (NPC) neural progenitor cells.
    </span>,

    <span><b> | SCREEN display of gene and TSS expression levels. a</b>, Gene expression of EP300 from whole-cell RNA-seq assays shown in tags per million (TPM). <b>b</b>, RAMPAGE signal at the TSS of ENST00000263253.7 (averaged over ± 50 bp window).
        Bars are colored by tissue of origin indicated on the left.
    </span>,

    <span><b> | Enhancer prediction using the average rank of DNase and H3K27ac signals.</b> For each tissue, we sorted DNase peaks by the average rank of DNase signal (green) and H3K27ac signal (yellow) and estimated enhancer boundaries using the overlapping H3K27ac peaks.</span>,

    <span><b> | In vivo validation of ENCODE-predicted enhancers.</b>  Shown are representative transgenic embryonic day 11.5 (e11.5) mouse images for all predicted enhancers that displayed reproducible activity in the expected tissue type.
        Enhancer predictions were performed using a combination of H3K27ac and DHS profiling for E11.5 mouse hindbrain, midbrain, and limb tissue.
        Predicted enhancers were selected for validation from three different rank classes (Top, Middle, Bottom) and tested for activity using transgenic mouse assays (see Methods for further details).
        Blue staining indicates enhancer activity, and the unique identifier below each embryo (mm number) corresponds to the name of the enhancer in the VISTA Enhancer Browser (<a href="http://www.enhancer.lbl.gov">www.enhancer.lbl.gov</a>).
    </span>,

    <span><b> | Methods and properties of cREs a</b>, Methods for classifying cREs in mouse. This panel corresponds to Fig. 4a, but for mouse. We begin by clustering high quality DHSs (FDR > 0.1%) to create representative DHSs (rDHSs).
        For each assay (DNase, H3K4me3, H3K27ac or CTCF), we calculate a Z-score for every rDHS in a particular cell or tissue type. We then obtain the maximum Z-score across all cell types, known as the Max-Z.
        Using the Max-Z as well as the distance to the nearest TSS, we classify cREs into three cell-type agnostic groups using the decision tree: cREs with promoter-like signatures (n = 87,119), cREs with enhancer-like signatures (n = 310,472), and cREs bound by CTCF only (n = 33,611).
        The total number of cREs is the sum of the three groups: 431,202. <b>b-c</b>. Distribution of cRE lengths stratified by distance from annotated TSSs. In <b>b</b>, human and <b>c</b>, mouse, cREs that overlap TSSs are longer than non-overlapping cREs (Wilcoxon test p-values &lt; 2.2e-16).
        &nbsp;<b>d</b>, to estimate the coverage of the current Registry of cREs, we generated rDHSs using varying numbers of cell types, randomly selecting the datasets each time. After performing this randomization 100 times for 10 to 440 cell types, we estimated the number of rDHSs at 95% saturation using a Weibull distribution (<em>r<sup>2</sup></em>=0.99).
        We estimate that there are in total 2,677,746 rDHS and among them 1,760,045 have max-Z > 1.64. At 440 cell types, we have 2,115,300 rDHSs with 1,661,868 having max-Z > 1.64.
        Because only a subset of the 1,760,045 rDHSs max-Z > 1.64 can be cREs—those that are also supported by H3K4me3, H3K27ac, or CTCF in at least one cell type—the current coverage of the Registry is (1,310,152/1,760,045 = 74.4%).
    </span>,

    <span><b> | Coverage of histone mark and CTCF peaks by the current human Registry of cREs.</b> Overlap of cREs with <b>a</b>, H3K4me3 peaks, <b>b</b>, H3K27ac peaks and <b>c</b>, CTCF peaks from cell types without DNase data. On average 89.7%, 86.8%, and 99.1% of H3K4me3, H3K27ac, and CTCF peaks respectively overlap a cRE.</span>,

    <span><b> | Coverage of histone mark peaks by the current mouse Registry of cREs.</b> Overlap of cREs with <b>a</b>, H3K4me3 peaks and <b>b</b>, H3K27ac peaks from cell types without DNase data. On average 95.8% and 87.6% of H3K4me3 and H3K27ac peaks respectively overlap a cRE.</span>,

    <span><b> | Coverage of the H3K4me3 peaks by the current Registry of cREs is plotted against the average -log(FDR) of the H3K4me3 peaks.</b> In <b>a</b>, human and <b>b</b>, mouse, cell-types with peaks that have a lower average -log(FDR) across all peaks tend to have a lower percentage of peaks covered.
        Manual inspection reveals that this is due to lower-signal, false-positive peaks called by the algorithm for these datasets.
    </span>,

    <span><b> |  Coverage, saturation and cell-type specific annotations of the Registry of cREs.</b> Percent of the DNase-mappable (36 nt, single-end reads) genome covered by each group of cREs in <b>a</b>, human and <b>b</b>, mouse. <b>c</b>, number of GM12878 cREs in each group.
        &nbsp;<b>e</b>, Total numbers of cREs with Promoter-like, Enhancer-like, or CTCF-only signatures grow when more cell types are considered. Enhancer-like cREs are more cell-type-restrictive than promotor-like cREs or CTCF-only cREs. 
    </span>,

    <span><b> | Overlap of cREs with chromHMM states.</b> In GM12878, we ranked cREs with <b>a</b>, promoter-like signatures and <b>b</b>, enhancer-signatures by H3K4me3 and H3K27ac Z-scores respectively.
        For each bin of 1 k cREs, we calculated the percent of cREs overlapping each chromHMM state. In mouse, we selected all cREs with <b>c</b>, promoter-like and <b>d</b>, enhancer-like signatures from tissue–time-point combinations with both DNase-seq and histone mark ChIP-seq data.
        We then calculated the percent of cREs which overlapped each chromHMM state. In all panels, high- and low-signal enhancers denote chromHMM enhancer states with high or low H3K27ac signals.
    </span>,

    <span><b> | Clustering of human cell and tissue types by cRE H3K27ac signal.</b> Human <b>a</b>, primary cells and <b>b</b>, tissues were hierarchically clustered by the Jaccard similarity coefficient of cREs with high H3K27ac signal (Z-score > 1.64).
        In <b>a</b>, three perfectly segregated groups of primary cells are colored by their embryonic origins: blood, non-blood mesoderm, and ectoderm. Even the endothelial cells of umbilical vein, which derived from the extraembryonic mesoderm,
        &nbsp;clustered with the cell types derived from the embryonic mesoderm (fibroblasts, myoblasts, osteoblasts, and astrocytes). In <b>b</b>, Tissues from different regions of the same organ tended to cluster together, e.g., the various brain regions.
        Fetal and adult tissues of the same kind often aggregated together (e.g., adrenal gland). The samples from the gastrointestinal tract formed two clusters, one reflecting smooth muscles (the purple and maroon samples at the top) and the other reflecting mucosa (the maroon samples at the center).
    </span>,

    <span><b> | Clustering of human cell and tissue types by cRE DNase signal.</b> Human <b>a</b>, primary cells and <b>b</b>, tissues hierarchically clustered by the Jaccard similarity coefficient of cREs with high DNase signal (Z-score > 1.64). The primary cells in a are colored by their lineages.
        They segregated into two large clusters, with the left cluster (in red) composed entirely of blood cells, subdivided into to the myeloid and lymphoid lineages, respectively. The leftmost sub-cluster of the right cluster contained the four trophoblast samples (in black), reflecting their extraembryonic fate.
        The rightmost sub-cluster contained mostly fibroblasts while the middle sub-cluster contained endothelial cells, epithelial cells, keratinocytes, melanocytes, etc. The fibroblasts aggregated together regardless of their anatomical locations, as did most of the endothelial cells, consistent with their common mesodermal origin.
        Most of the epithelial cells also clustered together despite their different embryonic germ layers. The tissue samples in <b>b</b> segregated almost completely by their organs of origin, each with a different color.
    </span>,

    <span><b> |  Clustering of and mouse cell types by cRE activity.</b> Mouse embryonic tissues were hierarchically clustered by the Jaccard similarity coefficient of cREs with high <b>a</b>, H3K27ac <b>b</b>, H3K4me3 <b>c</b>, DNase and <b>d</b>, CTCF (Z-score > 1.64).
        Colors indicate the organs of the tissues. When clustered by H3K27ac signals at cREs (panel <b>a</b>), the tissues segregated completely by their organs of origin. 
    </span>,

    <span><b> | Overall cell type enrichments for variants reported by genome-wide association studies.</b> Heatmap indicates enrichment a -log(p-value) of the variants associated with each disease (rows) in cREs active in each cell type (columns). Activity is defined as H3K27ac Z-score > 1.64. Color values in each row are scaled per study.</span>,

    <span><b> | Top cell type enrichments for variants reported by genome-wide association studies.</b> For each GWAS included in SCREEN, we report the cell or tissue type of which active cREs are significantly enriched in the disease variants.
        Cell types that do not meet FDR threshold of 0.05 are in gray. The majority of studies have multiple significantly enriched cell types but only the top hit is reported here. Traits listed multiple times are from different studies.
    </span>,

    <span><b> | SCREEN display of the ZMIZ1 gene and its TSS expression levels. a</b>, Gene expression of <em>ZMIZ1</em> from whole-cell RNA-seq assays shown in tags per million (TPM). <b>b</b>, RAMPAGE signal at the TSS of ENST00000472035.1 (averaged over ± 50 bp window).  Bars are colored by tissue of origin indicated on the left.</span>,

    <span><b> | SCREEN display of <em>PPIF</em> gene and its TSS expression levels. a</b>, Gene expression of <em>PPIF</em> from whole-cell RNA-seq assays shown in tags per million (TPM). <b>b</b>, RAMPAGE signal at the TSS of ENST00000225174.3 (averaged over ± 50 bp window).  Bars are colored by tissue of origin indicated on the left.</span>,

    <span><b> | SCREEN display of <em>AGAP1</em> expression levels. a</b>, In human. <em>AGAP1</em> is expressed across many adult tissues. <b>b</b>, In mouse. <em>Agap1</em> is primarily expressed in embryonic brain tissues. Expression values were calculated from whole-cell RNA-seq experiments and displayed in tags per million (TPM).</span>,

    <span><b> | H3K27ac signal at EM10E0042440 across mouse embryonic tissues.</b> H3K27ac signal measured as fold-change between ChIP and input is displayed across 12 tissues and 8 time-points. Tissues without H3K27ac ChIP-seq data are left blank. The maximal height of signal is 10.</span>,

    <span><b> | Method for normalizing epigenomics signals. a</b>, distribution of the H3K27ac signals at rDHSs from five cell types (B cell, Liver, K562, T cell, and GM12878; shown in different colors).
        &nbsp;<b>b</b>, Distributions of the Log of the H3K27ac signals in <b>a</b>. Individually, log(signal) values of the rDHSs in each cell type roughly follow a normal distribution. <b>c</b>, Distribution of the Z-scores corresponding to the log(signal) values in <b>b</b>. Zero signal values are assigned a Z-score of -10.
    </span>

]);

export const ExtendedTitles = () => ([
    "RAMPAGE data signal at EP300",
    "DNA replication timing (RT) programs of distinct human cell types",
    "DNA replication timing (RT) programs are cell type-specific",
    "SCREEN display of gene and TSS expression levels",
    "Enhancer prediction using the average rank of DNase and H3K27ac signals",
    "In vivo validation of ENCODE-predicted enhancers",
    "Methods and properties of cREs",
    "Coverage of histone mark and CTCF peaks by the current human Registry of cREs",
    "Coverage of histone mark peaks by the current mouse Registry of cREs",
    "Coverage of the H3K4me3 peaks by the current Registry of cREs is plotted against the average -log(FDR) of the H3K4me3 peaks",
    "Coverage, saturation and cell-type specific annotations of the Registry of cREs",
    "Overlap of cREs with chromHMM states",
    "Clustering of human cell and tissue types by cRE H3K27ac signal",
    "Clustering of human cell and tissue types by cRE DNase signal",
    "Clustering of and mouse cell types by cRE activity",
    "Overall cell type enrichments for variants reported by genome-wide association studies",
    "Top cell type enrichments for variants reported by genome-wide association studies",
    "SCREEN display of the ZMIZ1 gene and its TSS expression levels",
    "SCREEN display of PPIF gene and its TSS expression levels",
    "SCREEN display of AGAP1 expression levels",
    "H3K27ac signal at EM10E0042440 across mouse embryonic tissues",
    "Method for normalizing epigenomics signals"
]);
