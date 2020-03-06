import { gql } from 'apollo-server-express';
import { GraphQLResolverMap } from 'apollo-graphql';
import { buildFederatedSchema } from '@apollo/federation';

import { resolve_ccres, cCREResolvers } from '../resolvers/cretable';
import { resolve_globals, globalsResolvers } from '../resolvers/globals';
import { resolve_de } from '../resolvers/de';
import { resolve_geneexp } from '../resolvers/geneexp';
import { resolve_gwas, gwasResolvers } from '../resolvers/gwas';
import { resolve_ccre, cCREDetailsResolvers } from '../resolvers/credetails';
import { resolve_rampage } from '../resolvers/rampage';
import { resolve_snps, snpResolvers } from '../resolvers/snp';
import { resolve_biosampleinfo_ccREActivity, resolve_gene_exons } from '../resolvers/common';

// For when these come back
/*
    Query {
        "Get gene expression by biosample"
        genetop(assembly: Assembly!, biosample: String!): [TopGenesReplicateData!]
    }

    scalar Minipeaks

    type ccreDetails {
        "Returns intersection counts for cistrome transcription factor and histone modification ChIP-seq data"
        cistromeIntersection: ChIPSeqIntersections!
        "Returns intersecting FANTOM CAT RNAs"
        fantom_cat: FantomCat!
        "Returns signal profile data"
        miniPeaks: Minipeaks
        "Returns the intersection data that supports a specific target"
        ccreTargetData(
            target: String!
            target_type: ChIPSeqTargetType!
            eset: IntersectionSource!
        ): [ChIPSeqIntersectionData!]!
    }

    type FantomCat {
        fantom_cat: [FantomCatData!]!
        fantom_cat_twok: [FantomCatData!]!
    }

    type FantomCatData {
        id: Int!
        range: ChromRange!
        geneid: String!
        genename: String!
        aliases: String!
        geneclass: String!
        dhssupport: String!
        genecategory: String!
        tirconservation: Float
        exonconservation: Float
        traitdfr: Float
        eqtlcoexpr: Float
        dynamicexpr: Float
        other_names: String!
    }

    enum IntersectionSource {
        CISTROME
    }

    scalar Files
    scalar cCREBedsByCellType
    scalar cCREFiles

    type Globals {
        files: Files
    }

    type AssemblySpecificGlobals {
        "Returns the accessions of the celltype-specific bigBed files for cCREs on ENCODE"
        cCREBedsByCellType: cCREBedsByCellType
        "Returns info on the data used to create cCREs"
        cCREFiles: cCREFiles
    }

    type TopGenesReplicateData {
        tissue: String!
        cellType: String!
        gene_name: String!
        expID: String!
        ageTitle: String!
        rID: String!
        replicate: String!
        rawTPM: Float!
        logTPM: Float!
        rawFPKM: Float!
        logFPKM: Float!
    }
*/

export const typeDefs = gql`
    type Query {
        "Get data for cCREs"
        ccres(
            assembly: Assembly!
            "A list of accessions to return"
            accessions: [String!]
            "Get cCREs overlapping a given range"
            range: InputChromRange
            "Only return cCREs with max zscores for all available experiments that fall within specific ranges"
            expmaxs: InputExpMax
            "Only return cCREs with zscores that fall within specific ranges for the specified cell type"
            ctexps: InputCtExps
            "Advanced parameters to define offset/limit/order."
            pagination: PaginationParameters
        ): cCREs
        "Get details for a specific cCREs"
        ccre(accession: String!): cCRE
        "Get global data"
        globals: Globals
        "Get differential expression data"
        differentialExpression(assembly: Assembly!, gene: String!, ct1: String!, ct2: String!): DifferentialExpression
        "Get gene expression data"
        geneExpresssion(
            assembly: Assembly!
            gene: String!
            "A list of biosamples types to filter by. By default, will include all available biosample types. Available biosample types can be queried with {globals{byAssembly{geBiosampleTypes}}}"
            biosample_types: [String!]
            "A list of compartments to filter by. By default, will include all available compartments. Available compartments can be queried with {globals{byAssembly{cellCompartments}}}"
            compartments: [String!]
        ): GeneExpression
        gwas(assembly: Assembly!): Gwas
        "Get RAMPAGE data for a gene"
        rampage(assembly: Assembly!, gene: String!): RampageGeneData
        snps(assembly: Assembly!, id: String, range: InputChromRange): [SNP!]
    }

    enum Assembly {
        GRCh38
        mm10
    }

    "Represents a range on a chromomsome."
    input InputChromRange {
        "Chromosome"
        chrom: String!
        "Start position or null if full chromosome"
        start: Int
        "End position or null if full chromosome"
        end: Int
    }

    "Defines information related to experimental zscore ranges"
    input InputExpMax {
        "Start of ctcf zscore range"
        rank_ctcf_start: Float
        "End of ctcf zscore range"
        rank_ctcf_end: Float
        "Start of dnase zscore range"
        rank_dnase_start: Float
        "End of dnase zscore range"
        rank_dnase_end: Float
        "Start of enhancer zscore range"
        rank_enhancer_start: Float
        "End of enhancer zscore range"
        rank_enhancer_end: Float
        "End of promoter zscore range"
        rank_promoter_start: Float
        "Start of promoter zscore range"
        rank_promoter_end: Float
    }

    """
    Defines acceptable zscore ranges for a single celltype.
    If a particular celltype does not have a particular experiment, then the range will not be applicable
    """
    input InputCtExps {
        "The celltype that the ranges apply to"
        cellType: String!
        "Start of ctcf zscore range"
        rank_ctcf_start: Float
        "End of ctcf zscore range"
        rank_ctcf_end: Float
        "Start of dnase zscore range"
        rank_dnase_start: Float
        "End of dnase zscore range"
        rank_dnase_end: Float
        "Start of enhancer zscore range"
        rank_enhancer_start: Float
        "End of enhancer zscore range"
        rank_enhancer_end: Float
        "End of promoter zscore range"
        rank_promoter_start: Float
        "Start of promoter zscore range"
        rank_promoter_end: Float
    }

    "ADVANCED - you probably do not need this. offset + limit <= 10000; limit <= 1000; to access more data, refine your search"
    input PaginationParameters {
        "Default 0. Instead of starting at the first cCRE, return cCREs offsetted."
        offset: Int
        "Default 1000. Change the limit to the number of cCREs returned."
        limit: Int
        "The field to order by. If an ct-specific orderby is passed, but is not applicable to the ct (i.e. no data), then maxz will be used instead."
        orderBy: OrderBy
    }

    enum OrderBy {
        "(DEFAULT)"
        maxz
        maxz_ct
        dnasemax
        k27acmax
        k4me3max
        ctcfmax
        "(Only available if celltype-specific)"
        dnase_zscore
        "(Only available if celltype-specific)"
        promoter_zscore
        "(Only available if celltype-specific)"
        enhancer_zscore
        "(Only available if celltype-specific)"
        ctcf_zscore
    }

    type cCREs {
        "Returns the total number of cCREs that match the parameters. However, for speed, only up to the top 1000 will be displayed"
        total: Int!
        "Returns the cCREs that match the parameters"
        ccres: [cCRE!]!
    }

    scalar InputData

    type Globals {
        inputData: InputData
        byAssembly(assembly: Assembly!): AssemblySpecificGlobals!
    }

    scalar ChromCounts
    scalar ChromLens
    scalar cCREHistBins
    scalar AssemblyInputData

    type AssemblySpecificGlobals {
        "The assembly these globals are for"
        assembly: Assembly!
        "A list of all transcription factors used"
        tfs: [String!]!
        "A list of cell compartments"
        cellCompartments: [String!]!
        "Get info on all biosamples used and assays used for cCRE data"
        biosamples: [BiosampleInfo!]
        "Gets the info for a specific biosample"
        biosample(biosample: String!): BiosampleInfo
        "Returns the numbers of cCREs keyed by chromosome"
        chromCounts: ChromCounts
        "Returns the length of each chromosome"
        chromLens: ChromLens
        "Returns the numbers of cCREs in each bin of a chromosome"
        cCREHistBins: cCREHistBins
        "Returns biosample types available in gene expression"
        geBiosampleTypes: [String!]!
        "Returns biosamples available in gene expression"
        geBiosamples: [String!]!
        "Returns info on the data used for SCREEN"
        inputData: AssemblyInputData
    }

    """
    Represents a single cCRE.

    Note that querying of 'details' is limited to up to only 5 cCREs at a time, for performance.
    """
    type cCRE {
        "Assembly the cCRE is defined of"
        assembly: Assembly!
        "Accession of this cCRE"
        accession: String!
        "The range of the cCRE"
        range: ChromRange!
        "The max zscore from any experiment in any celltype"
        maxz: Float!
        "Max dnase zscore of all experiments"
        dnasemax: Float!
        "Max ctcf zscore of all experiments"
        ctcfmax: Float!
        "Max k27ac zscore of all experiments"
        k27acmax: Float!
        "Max k4me3 zscore of all experiments"
        k4me3max: Float!
        "Does this cCRE have an ortholog in other assemblies"
        concordant: Boolean!
        "Is cCRE +/- 2kb of TSS"
        isproximal: Boolean!
        "celltype-specific zscores"
        ctspecific(ct: String!): CtSpecific
        "Nearby genes"
        nearbygenes: Genes!
        "Get details about this cCRE"
        details: ccreDetails!
    }

    "Represents a range on a chromomsome. May optionally specify a strand."
    type ChromRange {
        "Chromosome"
        chrom: String!
        "Start position or null if full chromosome"
        start: Int
        "End position or null if full chromosome"
        end: Int
        "Strand of this range or null if not defined"
        strand: String
    }

    "If a celltype was specific, provide celltype-specific data"
    type CtSpecific {
        "Current celltype"
        ct: String!
        "Dnase zscore in the celltype, or null if not available"
        dnase_zscore: Float
        "h3k4me3 zscore in the celltype, or null if not available"
        h3k4me3_zscore: Float
        "h3k27ac zscore in the celltype, or null if not available"
        h3k27ac_zscore: Float
        "Ctcf zscore in the celltype, or null if not available"
        ctcf_zscore: Float
        "The max z score of all ctspecific data"
        maxz: Float!
    }

    "Nearby genes"
    type Genes {
        "Nearby protein-coding genes"
        pc: [NearbyGene!]!
        "All nearby genes, including protein-coding and non-protein-coding"
        all: [NearbyGene!]!
    }

    "Distance and gene info for a nearby gene"
    type NearbyGene {
        "The distance to the cCRE"
        distance: Int!
        "The gene"
        gene: CommonGene!
        "Whether or not this gene is protein coding"
        pc: Boolean!
    }

    "Get details of various experiments related to this cCRE."
    type ccreDetails {
        "Returns biosamle-specific experiment data"
        biosampleSpecificSignals: [AssayData!]!
        "Returns nearby genomic elements"
        nearbyGenomic: NearbyGenomic!
        #"Returns intersecting FANTOM CAT RNAs"
        #fantom_cat: FantomCat!
        "Returns orthologous cCREs"
        ortholog(
            "The assembly to check for an ortholog in. Since there may not be data for the other assembly, it is a String not an 'Assembly'"
            assembly: String!
        ): [OrthologouscCRE!]
        "Returns intersection counts for transcription factor and histone modification ChIP-seq data"
        tfIntersection: ChIPSeqIntersections!
        "Returns linked genes"
        linkedGenes: [LinkedGene!]!
    }

    "The celltype-specific z-scores for this cCRE"
    type AssayData {
        ct: BiosampleInfo!
        dnase: Float
        h3k4me3: Float
        h3k27ac: Float
        ctcf: Float
    }

    "Nearby genomic elements"
    type NearbyGenomic {
        "Nearby genes"
        nearby_genes: [NearbyGene!]!
        "Genes in the same TAD as this cCRE"
        tads: [CommonGene!]!
        "cCREs in the same TAD as this cCRE"
        re_tads: [NearbyRE!]!
        "Nearby cCREs"
        nearby_res: [NearbyRE!]!
        "SNPs within 10kb of this cCRE"
        nearby_snps: [NearbySNP!]!
    }

    "A nearby cCRE"
    type NearbyRE {
        "The distance from the cCRE"
        distance: Int!
        cCRE: cCRE!
    }

    "A nearby SNP"
    type NearbySNP {
        "The distance to the cCRE"
        distance: Int!
        "The SNP"
        snp: SNP!
    }

    "Represents an orthologous cCRE. It may be to an older assembly (e.g. hg19) or to a separate species (e.g. mm10)."
    type OrthologouscCRE {
        "The assembly of the orthologous cCRE. Since this may be assembly for which there is no data, it is not an 'Assembly'"
        assembly: String!
        "The accession of the orthologous cCRE"
        accession: String!
        "The location of the orthologous cCRE"
        range: ChromRange!
        "If there is data available for the orthologus cCRE (e.g. mm10), then the cCRE object. Otherwise, (e.g. hg19) null."
        cCRE: cCRE
    }

    type ChIPSeqIntersections {
        "ChIP-seq intersections with transcription factors"
        tf: [ChIPSeqIntersectionMetadata!]!
        "ChIP-seq intersections with histone marks"
        histone: [ChIPSeqIntersectionMetadata!]!
    }

    type ChIPSeqIntersectionMetadata {
        name: String!
        n: Int!
        total: Int!
    }

    type LinkedGene {
        gene: String!
        celltype: String!
        method: String!
        dccaccession: String!
    }

    type ChIPSeqIntersectionData {
        expID: String!
        biosample_term_name: String!
    }

    enum ChIPSeqTargetType {
        TF
        HISTONE
    }

    enum IntersectionSource {
        ENCODE
    }

    "Info on a biosample used in SCREEN and in cCREs"
    type BiosampleInfo {
        "A user-friendly name for this biosample"
        name: String
        "A machine-friendly name for this biosample (e.g. spaces with with underscores)"
        value: String!
        "The tissue this biosample is from"
        tissue: String!
        "True if there is differential expression data for this biosample"
        isde: Boolean!
        "Alternative names for this biosample"
        synonyms: [String!]
        "Epigentic assays performed on this biosample that were used to create cCREs"
        assays: [AssayMetadata!]
        "Get cCRE activity for this biosample"
        cCREActivity(ccre: String!): CtSpecific
    }

    "Info on a single assay from a biosample"
    type AssayMetadata {
        assay: String!
        expid: String!
        fileid: String!
        biosample_summary: String!
        biosample_type: String!
    }

    "Differential expression data"
    type DifferentialExpression {
        gene: CommonGene!
        diffcCREs: [DiffcCRE!]!
        "Null if there are no de genes"
        nearbyGenes: [DiffGene!]
        min: Int!
        max: Int!
    }

    type DiffcCRE {
        center: Float!
        value: Float!
        typ: String!
        cCRE: cCRE!
    }

    type DiffGene {
        isde: Boolean!
        fc: Float
        gene: CommonGene!
    }

    "Gene expression data"
    type GeneExpression {
        "Info on the gene queried. If the gene does not exist (like for spike-ins), this will be null."
        gene_info: CommonGene
        "All experimental data for this gene"
        items: [ExperimentData!]!
    }

    "Gene exp data for an experiment"
    type ExperimentData {
        "The tissue this experiment is from"
        tissue: String!
        "The cell type this experiment is from"
        cellType: String!
        "The ENCODE accession of this experiment"
        expID: String!
        "The age title for this experiment"
        ageTitle: String!
        "All replicate data (including mean) for this experiment"
        reps: [ReplicateData!]!
    }

    "Gene exp data for a replicate in an experiment"
    type ReplicateData {
        "The replicate number or 'mean'"
        replicate: String!
        "The raw TPM value of the current gene for this replicate"
        rawTPM: Float!
        "The log2 TPM value of the current gene for this replicate"
        logTPM: Float!
        "The raw FPKM value of the current gene for this replicate"
        rawFPKM: Float!
        "The log2 FPKM value of the current gene for this replicate"
        logFPKM: Float!
        "The internal id to identify this replicate"
        rID: String!
    }

    "GWAS data"
    type Gwas {
        studies: [GwasStudy!]!
        study(study: String!): GwasStudy
        snps(search: String!): [SNP!]!
    }

    "GWAS study data"
    type GwasStudy {
        "Study name"
        name: String!
        "Study author"
        author: String!
        "Pubmed id"
        pubmed: String!
        "Study trait"
        trait: String!
        "Total number of LD blocks"
        totalLDblocks: Int!
        "Total number of LD blocks that overlap cCREs"
        numLdBlocksOverlap: Int!
        "Total number of cCRE that overlap"
        numcCREsOverlap: Int!
        allSNPs: [LDBlockSNP!]!
        topCellTypes: [GwasCellType!]
        ccres("The cell type to get cres for. If null, will get cres for all cell types" cellType: String): [GwasCCRE!]!
    }

    "Represents a SNP"
    type SNP {
        "The SNP assembly"
        assembly: Assembly!
        "The SNP id"
        id: String!
        "The range of this SNP"
        range: ChromRange!
        "Data related to LD blocks that this SNP belongs to. If no GWAS data is available for the SNP assembly or no related GWAS data is available, this is an empty array."
        ldblocks: [LDBlockSNP!]!
        "GWAS studies containing this SNP. If no GWAS data is available for the SNP assembly or no related GWAS data is available, this is an empty array."
        related_studies: [GwasStudy!]!
        "Returns the cCRE that overlaps this SNP, if one exists"
        overlapping_cCRE: cCRE
        nearbygenes: [GeneAndDistance!]!
    }

    "A SNP in an LD Block in a study"
    type LDBlockSNP {
        snp: SNP!
        r2: Float!
        ldblock: LDBlock!
    }

    "A single LD Block from a study"
    type LDBlock {
        name: String!
        study: GwasStudy!
        leadsnp: SNP!
        snps: [LDBlockSNP!]!
    }

    "Data about a specific cell type in a GWAS study"
    type GwasCellType {
        biosample_summary: String!
        expID: String!
        fdr: Float!
        pval: Float!
        ct: BiosampleInfo!
    }

    type GwasCCRE {
        cCRE: cCRE!
        geneid: String!
        snps: [String!]!
    }

    type GeneAndDistance {
        distance: Int!
        gene: CommonGene!
    }

    "Gene info for gene expression"
    type CommonGene {
        assembly: Assembly!
        "The gene name"
        gene: String!
        "The ensembl id and ver of the gene"
        ensemblid_ver: String!
        "The coordinates of this gene"
        coords: ChromRange!
        exons: [ChromRange!]!
    }

    "Rampage data for a specific gene"
    type RampageGeneData {
        transcripts: [RampageTranscript!]!
        gene: CommonGene!
    }

    type RampageTranscript {
        transcript: String!
        range: ChromRange!
        geneinfo: String!
        items: [RampageTranscriptData!]!
    }

    type RampageTranscriptData {
        expid: String!
        fileid: String!
        biosample_term_name: String!
        biosample_type: String!
        biosample_summary: String!
        tissue: String!
        strand: String!
        counts: Float!
    }
`;

export const resolvers = ({
    Assembly: {
        GRCh38: 'grch38',
        mm10: 'mm10',
    },
    IntersectionSource: {
        ENCODE: 'peak',
        //CISTROME: 'cistrome',
    },
    Query: {
        ccres: resolve_ccres,
        ccre: resolve_ccre,
        globals: resolve_globals,
        differentialExpression: resolve_de,
        geneExpresssion: resolve_geneexp,
        gwas: resolve_gwas,
        rampage: resolve_rampage,
        //genetop: resolve_genetop,
        snps: resolve_snps,
    },
    BiosampleInfo: {
        cCREActivity: resolve_biosampleinfo_ccREActivity,
    },
    CommonGene: {
        exons: resolve_gene_exons,
    },
} as any) as GraphQLResolverMap;

export const generatedSchema = buildFederatedSchema([
    {
        typeDefs,
        resolvers: ({
            ...resolvers,
            ...cCREResolvers,
            ...globalsResolvers,
            ...cCREDetailsResolvers,
            ...gwasResolvers,
            ...snpResolvers,
        } as any) as GraphQLResolverMap,
    },
]);
