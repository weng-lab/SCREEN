export const intro = () => (
        <p>The ENCODE Encyclopedia comprises two levels of annotations. The ground level includes peaks and quantifications produced by uniform processing pipelines for individual data types.  The integrative level contains annotations produced by integrating multiple data types. In the core of the integrative level is the Registry of candidate Regulatory Elements (cREs), and SCREEN is a web-based visualization engine specifically designed for the Registry. SCREEN allows users to explore cREs and investigate how these elements connect with other annotations in the Encyclopedia, as well as raw ENCODE data whenever informative.
        </p>);

export const registry1 = () => (
        <p>The cREs in the Registry are the subset of representative DNase hypersensitivity sites (rDHSs) that are supported by histone modification and CTCF-binding data. We started with the DHSs called from 486 DNase-seq experiments in humans and 62 experiments in mouse using the  Hotspot2 algorithm (the algorithm was created by the Stam lab and run by the ENCODE data coordination center) and created the list of rDHSs using Bedops and a custom script by Robert Thurman in John Stam\'s lab (gitHub). This script iteratively merges DHSs across all experiments and selects the most significant DHS (i.e., the DHS with lowest false discovery rate or FDR). This process continues until it finally results in a list of non-overlapping rDHSs representing every DHS (Figure 1). We then filtered these rDHSs using an FDR threshold of 0.1%. This pipeline resulted in 2,568,674 rDHSs in human and 1,268,875 rDHSs in mouse, starting from the initial ~80M DHSs in human and ~15M DHSs in mouse at FDR 5% (Figure 2). We then asked whether each rDHS is supported by H3K4me3, H3K27ac, or CTCF signals. Our first step was to normalize signals between ChIP-seq experiments so that they were directly comparable. We calculated the average signal (in a 300 bp window for DNase and CTCF and a 1000 bp window for H3K27ac and H3K4me3) centered on each rDHS. We then transformed these averages to Z-scores by calculating the mean and standard deviation across all rDHSs.
        </p>);

export const registry2 = () => (
        <p>We assigned rDHSs to activity groups using a classification tree (Figure 2). First, we selected all rDHSs with a DNase max Z-score (across all cell types) of 1.64, resulting in 1.76M (68.5%) high-signal rDHSs. Then using H3K4me3 and H3K27ac max Z-scores and distance from TSSs, we identified Promoter-like and Enhancer-like cREs. From the rDHSs that did not fall into either category, we identified CTCF-only cREs using a CTCF max Z-score > 1.64. We separated the remaining rDHSs two groups based on whether they overlapped with peaks of active histone marks (H3K4me1/2/3, H3K27ac, and H3K9ac). The remaining 76,396 rDHSs were not included in the Registry.
        </p>);

export const registry3 = () => (
        <p>Using this classification scheme, each cRE can only belong to one group (Promoter-like, Enhancer-like, CTCF-only, other cREs supported by active histone marks) and these assignments are cell type agnostic. As cREs have cell-type dependent activities, in the next section we describe cell-type-specific assignments.
        </p>);

export const registry4 = () => (
        <p>We analyzed the percentage of the genome comprised of each cRE category (Figure 3). We only considered regions of the genome which is mappable by 36-nt long sequences in DNase-seq experiments (~2.65 Gb). In total, cREs cover 24.9% of the mappable genome.
        </p>);

export const genomicContext = () => (
    <p>{'Judged by GENCODE V19 annotations, 13.7% of cREs are proximal (±2Kb) to annotated GENCODE transcription start sites (TSSs) while the majority of cREs are distal from TSSs and lie in introns or intergenic regions. We annotated each cRE with genomic information including nearby genes and their expression levels, single nucleotide polymorphisms (SNPs), and element within the same topologically associated domains (TADs). These annotations can be found for each cRE on the "Nearby Genomic Features" tab.'}
    </p>)

export const occupancy1 = () => (
    <p>In addition to chromatin accessibility measured by DNase-seq experiments, each cRE is annotated using H3K27ac and H3K4me3 levels and CTCF occupancy to determine their potential regulatory roles (e.g. enhancer-like, promoter-like, or CTCF-bound insulator-like).  Our first step was to normalize signals between experiments so that they were directly comparable. We transformed the average signal across a cRE to the Z-score of log(signal).
    </p>);

export const occupancy2 = () => (
    <p>For each cRE, we calculated the Z-score of log(signal) across all cell and tissue types for DNase, H3K4me3, H3K27ac, and CTCF. We also computed a Promoter-like and Enhancer-like Z-score by averaging DNase & H3K4me3 and DNase & H3K27ac Z-scores respectively. This scores are available under the "Top Tissues" tab. Additionally, we also intersect each cRE all available histone mark and TF ChIP-seq peaks. We display these results in the "TF and His-mod Intersection" Tab.
    </p>);