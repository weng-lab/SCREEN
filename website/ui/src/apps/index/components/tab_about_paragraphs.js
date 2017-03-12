export const intro = () => (
    <p>
        The ENCODE Encyclopedia comprises two levels of annotations. The ground level includes peaks and quantifications produced by uniform processing pipelines for individual data types. The integrative level contains annotations produced by integrating multiple data types. The core of the integrative level is the Registry of candidate Regulatory Elements (cREs), and SCREEN is a web-based visualization engine specifically designed for the Registry. SCREEN allows users to explore cREs and investigate how these elements connect with other annotations in the Encyclopedia, as well as raw ENCODE data whenever informative.
    </p>);

export const registry1 = () => (
    <p>
        The cREs in the Registry are the subset of representative DNase hypersensitivity sites (rDHSs) that are supported by histone modification (H3K4me3 and H3K27ac) and CTCF-binding data. We started with the DHSs called from 449 DNase-seq experiments in humans and 62 experiments in mouse using the <a href="https://www.encodeproject.org/search/?type=Experiment&internal_tags=ENCYCLOPEDIAv4&assay_slims=DNA+accessibility&assembly=hg19&files.file_type=bed+broadPeak">Hotspot2</a> algorithm (the algorithm was created by the Stam lab and run by the ENCODE data coordination center) and created the list of rDHSs using <a href="https://www.ncbi.nlm.nih.gov/pubmed/22576172">Bedops</a> and a custom script by Robert Thurman in John Stam&#39;s lab (<a href="https://github.com/Jill-Moore/ENCODE3/blob/master/Registry-of-cREs/Create-cREs.sh">gitHub</a>). We started from the initial ~73M DHSs in human and ~13.8M DHSs in mouse at FDR 5% (<b>Figure 2</b>), and only kept the DHSs that passed the false discovery rate (FDR) threshold of 0.1%. We iteratively clustered DHSs across all experiments and selected the DHS with the highest signal (i.e., highest Z-score). This process continued until it finally resulted in a list of non-overlapping rDHSs representing all DHSs (<b>Figure 1</b>). This pipeline resulted in 2,115,300 rDHSs in human and 1,036,226 rDHSs in mouse.
    </p>);

export const registry2 = () => (
    <p>
We then asked whether each rDHS is supported by H3K4me3, H3K27ac, or CTCF-binding signals. We normalize signals between ChIP-seq experiments so that they were directly comparable, and calculated the average signal across each rDHS (for histone marks we extended this region on both ends by &plusmn;500 bp). We then transformed these averages to Z-scores by calculating the mean and standard deviation across all rDHSs in each histone mark or CTCF ChIP-seq experiment.
    </p>);

export const registry3 = () => (
    <p>
        We assigned rDHSs to activity groups (promoter-like, enhancer-like, and CTCF-bound insulator-like) in a cell-type agonistic manner using a classification tree (<b>Figure 3</b>, left panel). First, we selected all rDHSs with a DNase max Z-score (across all cell types) of at least 1.64, which corresponds to the 95th percentile in a one-tailed Z-test, resulting in 1.7M (80.6%) high-signal rDHSs. Then using H3K4me3 and H3K27ac max Z-scores and distance from the nearest TSS, we identified promoter-like and enhancer-like cREs. From the rDHSs that did not fall into either category, we identified CTCF-only cREs using a CTCF max Z-score &gt; 1.64. In total, we included 1,310,152 cREs in the registry. Using this classification scheme, each cRE can only belong to one group (Promoter-like, Enhancer-like, CTCF-only, other cREs supported by active histone marks) and these assignments are cell type agnostic.
    </p>);

export const registry4 = () => (
        <p>
            For mouse, we first selected rDHSs with a DNase max Z-score (across all cell types) of at least 0.86, which is the cutoff for mouse 43 cell and tissue types (with different developmental time points of the same tissue type among the 62 experiments counted just once) that corresponds to 181 human cell types (with tissue donors of the same cell or tissue type among the 449 experiments counted just once). We performed the same classification scheme for mouse (<b>Figure 3</b>, right panel) resulting in 527,001 cREs.
        </p>);

export const registry5 = () => (
        <p>
            We analyzed the percentage of the genome was composed of each cRE category (<b>Figure 4</b>), considering only regions of the genome which are mappable by 36-nt long sequences in DNase-seq experiments (~2.65 billion bases for human and 2.29 billion bases for mouse). In total, human cREs cover 20.8% of the mappable human genome and mouse cREs cover 10.0% of the mappable mouse genome (<b>Figure 4</b>).
        </p>);

export const genomicContext = () => (
    <p>
        Judged by GENCODE V19 annotations, 18.5% of cREs are proximal (&plusmn;2Kb) to annotated GENCODE transcription start sites (TSSs) while the majority of cREs are distal from TSSs and lie in introns or intergenic regions. We annotated each cRE with genomic information including nearby genes and their expression levels, single nucleotide polymorphisms (SNPs), and element within the same topologically associated domains (TADs). These annotations can be found for each cRE on the <i>Nearby Genomic Features</i> tab.
    </p>)

export const occupancy1 = () => (
    <p>
        In addition to chromatin accessibility measured by DNase-seq experiments, H3K4me3, H3K27ac or CTCF signal levels that predicts potential regulatory roles (enhancer-like, promoter-like, or CTCF-bound insulator-like), we also annotate each cRE using all available ChIP-seq data of other histone modifications and transcription factors. Specifically, we intersected each cRE with all available histone mark and TF ChIP-seq peaks, identified using ENCODE uniform processing pipelines. We display these results in the <i>TF and His-mod Intersection</i> Tab.
    </p>);

export const gwas1 = () => (
    <div>
        <p>Using the <a href="https://www.ebi.ac.uk/gwas/">NHGRI-EBI GWAS Catalog</a>, we selected studies with the following requirements:
        </p>
        <ul>
            <li>Study must be performed on single population, because mixed populations complicate linkage disequilibrium (LD) structures.
            </li>
            <li>For the time being, we are curating only study that use only subjects from CEU (caucasian-european) population, because we use population-specific LD data to perform statistical tests. We plan to include other populations in the near future.
            </li>
        </ul>
        <p>
            For each study, we downloaded all reported SNPs, even those that were just under genome wide significance.
        </p>
    </div>)

export const gwas2 = () => (
    <div>
        <p>
For each study, we created a control set of SNPs accounting for minor allele frequencies (in CEU population) and distance from transcription start sites (TSS) using SNPs from SNP-Chip arrays. This method was adapted and modified from the <a href="https://github.com/robertkleinlab/uesEnrichment">Uncovering Enrichment through Simulation (UES)</a> method developed by the Klein Lab (Hayes <i>et al.</i> 2015). For each GWAS tagged SNP we generated 100 matched controls. For both GWAS SNPs and control SNPs we also included all SNPs in LD with them (default r<sup>2</sup> ;&gt; 0.7).
        </p>

        <p>
Using all GWAS SNPs + LD and Control SNPs + LD we then intersected the SNPs with cREs. For cell-type-specific enrichment, we required the cRE to have a H3K27ac Z-score of 1.64 in that cell type. After pruning for LD, (i.e. only counting one cell-type-specific cRE per LD block) we used Fisher&#39;s exact test to determine if the GWAS SNPs were enriched in the cRE specific to each cell type. We are in the process of calculating cell type enrichment based on cREs with a DNase Z-score above 1.64 in that cell type.
        </p>
    </div>)

export const citation = () => (
    <ul>
        <li>ENCODE Project Consortium, Bernstein BE, Birney E, Dunham I, Green ED, Gunter C, Snyder M. 2012. An integrated encyclopedia of DNA elements in the human genome. <i>Nature</i> 489: 57–74.</li>
        <li>ENCODE Project Consortium, Myers RM, Stamatoyannopoulos J, Snyder M, Dunham I, Hardison RC, Bernstein BE, Gingeras TR, Kent WJ, Birney E, et al. 2011. A user's guide to the encyclopedia of DNA elements (ENCODE). <i>PLoS Biol</i> 9: e1001046.</li>
    </ul>)

export const figure = (num, alt, style = {}) => {
    return (
        <div>
            <figure className={"figure"}>
	        <img src={"/static/about/images/figure" + num + ".png"}
                     className={"figure-img img-fluid rounded img-responsive"}
                     alt={alt}
	             style={style}
                />
                <figcaption className={"figure-caption"}>
                    Figure {num}
                </figcaption>
            </figure>
    </div>);
}