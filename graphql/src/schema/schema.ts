import { gql } from 'apollo-server-express';
import { GraphQLResolverMap } from 'apollo-graphql';
import { buildFederatedSchema } from '@apollo/federation';

import {
    resolve_data,
    resolve_data_range,
    resolve_data_ctspecific,
    resolve_data_nearbygenes,
} from '../resolvers/cretable';
import {
    resolve_globals,
    resolve_globals_inputData,
    resolve_globals_assembly,
    resolve_globals_assembly_tfs,
    resolve_globals_assembly_cellCompartments,
    resolve_globals_assembly_cellTypeInfoArr,
    resolve_ctinfo,
    resolve_globals_assembly_chromCounts,
    resolve_globals_assembly_chromLens,
    resolve_globals_assembly_creHistBins,
    resolve_globals_assembly_geBiosampleTypes,
    resolve_globals_assembly_geBiosamples,
    resolve_globals_assembly_inputData,
} from '../resolvers/globals';
import { resolve_de } from '../resolvers/de';
import { resolve_geneexp } from '../resolvers/geneexp';
import {
    resolve_gwas,
    resolve_gwas_study,
    resolve_gwas_studies,
    resolve_gwas_snps,
    resolve_gwas_study_numCresOverlap,
    resolve_gwas_study_numLdBlocksOverlap,
    resolve_gwas_study_allSNPs,
    resolve_gwas_study_topCellTypes,
    resolve_gwas_study_cres,
} from '../resolvers/gwas';
import {
    resolve_credetails,
    resolve_details,
    resolve_cre_topTissues,
    resolve_cre_nearbyGenomic,
    resolve_cre_ortholog,
    resolve_cre_tfIntersection,
    resolve_cre_cistromeIntersection,
    resolve_cre_linkedGenes,
    resolve_cre_target_data,
    resolve_cre_nearbyGenomic_nearbyGenes,
    resolve_cre_nearbyGenomic_genesInTad,
    resolve_cre_nearbyGenomic_re_tads,
    resolve_cre_nearbyGenomic_nearbyCREs,
    resolve_cre_nearbyGenomic_snps,
    resolve_cre_ortholog_cCRE,
} from '../resolvers/credetails';
import { resolve_rampage } from '../resolvers/rampage';
import { resolve_genetop } from '../resolvers/genetop';
import {
    resolve_snps,
    resolve_snps_ldblocks,
    resolve_snps_nearbygenes,
    resolve_snps_overlapping_ccRE,
    resolve_snps_relatedstudies,
    resolve_gwas_ldblock_snps,
    resolve_gwas_ldblock_leadsnp,
} from '../resolvers/snp';
import { resolve_celltypeinfo_ccREActivity, resolve_gene_exons } from '../resolvers/common';

// For when these come back
/*
    scalar Minipeaks

    type cCreDetailsResponse {
        "Returns intersecting FANTOM CAT RNAs"
        fantom_cat: FantomCat!
        "Returns signal profile data"
        miniPeaks: Minipeaks
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

    type GlobalsResponse {
        files: Files
    }

    type AssemblySpecificGlobalsResponse {
        "Returns the accessions of the celltype-specific bigBed files for ccREs on ENCODE"
        cCREBedsByCellType: cCREBedsByCellType
        "Returns info on the data used to create ccREs"
        cCREFiles: cCREFiles
    }

*/

export const typeDefs = gql`
    type Query {
        "Get cCRE data"
        data(assembly: Assembly!, data: DataParameters, pagination: PaginationParameters): DataResponse
        "Get global data"
        globals: GlobalsResponse
        "Search differential expression data"
        de_search(assembly: Assembly!, gene: String!, ct1: String!, ct2: String!): DeResponse
        "Get gene expression data"
        geneexp_search(
            assembly: Assembly!
            gene: String!
            "A list of biosamples types to filter by. By default, will include all available biosample types. Available biosample types can be queried with {globals{byAssembly{geBiosampleTypes}}}"
            biosample_types: [String!]
            "A list of compartments to filter by. By default, will include all available compartments. Available compartments can be queried with {globals{byAssembly{cellCompartments}}}"
            compartments: [String!]
        ): GeneExpResponse
        gwas(assembly: Assembly!): GwasResponse
        "Get details for a specific cCREs"
        credetails(accession: String!): cCRE
        "Get RAMPAGE data for a gene"
        rampage(assembly: Assembly!, gene: String!): RampageGeneData
        "Get gene expression by biosample"
        genetop(assembly: Assembly!, biosample: String!): [TopGenesReplicateData!]
        snps(assembly: Assembly, id: String, range: InputChromRange): [SNP!]
    }

    enum Assembly {
        GRCh38
        mm10
    }

    "Parameters to define what ccREs should be returned from a DataResponse"
    input DataParameters {
        "A list of accessions to return"
        accessions: [String!]
        range: InputChromRange
        "Only return ccREs with max zscores for all available experiments that fall within specific ranges"
        expmaxs: InputExpMax
        "Only return ccREs with zscores for all available experiments that fall within specific ranges for the specified cell type"
        ctexps: InputCtExps
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
        "Default 0. Instead of starting at the first ccRE, return ccREs offsetted."
        offset: Int
        "Default 1000. Change the limit to the number of ccREs returned."
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

    type DataResponse {
        "Returns the total number of ccREs that match the parameters. However, for speed, only up to the top 1000 will be displayed"
        total: Int!
        "Returns the ccREs that match the parameters"
        ccres: [cCRE!]!
    }

    scalar Files
    scalar InputData

    type GlobalsResponse {
        inputData: InputData
        byAssembly(assembly: Assembly!): AssemblySpecificGlobalsResponse!
    }

    scalar ChromCounts
    scalar ChromLens
    scalar cCREHistBins
    scalar AssemblyInputData

    type AssemblySpecificGlobalsResponse {
        "A list of all transcription factors used"
        tfs: [String!]!
        "A list of cell compartments"
        cellCompartments: [String!]!
        "Get info on all cell types used and assays used for ccRE data"
        cellTypeInfoArr: [CellTypeInfo!]
        "Gets the info for a specific cell type. Can use 'none' to return nothing."
        ctinfo(cellType: String!): CellTypeInfo
        "Returns the numbers of ccREs keyed by chromosome"
        chromCounts: ChromCounts
        "Returns the length of each chromosome"
        chromLens: ChromLens
        "Returns the numbers of ccREs in each bin of a chromosome"
        cCREHistBins: cCREHistBins
        "Returns biosample types available in gene expression"
        geBiosampleTypes: [String!]!
        "Returns biosamples available in gene expression"
        geBiosamples: [String!]!
        "Returns info on the data used for SCREEN"
        inputData: AssemblyInputData
    }

    type cCRE {
        "Assembly the ccRE is defined of"
        assembly: Assembly!
        "Accession of this ccRE"
        accession: String!
        "The range of the ccRE"
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
        "Does this ccRE have an ortholog in other assemblies"
        concordant: Boolean!
        "Is ccRE +/- 2kb of TSS"
        isproximal: Boolean!
        "celltype-specific zscores"
        ctspecific(ct: String!): CtSpecific
        "Nearby genes"
        nearbygenes: Genes!
        "Get details about this ccRE"
        details: cCreDetailsResponse!
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
    type cCreDetailsResponse {
        "Returns celltype-specific experiment data"
        topTissues: [CTAssayData!]!
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
        "Returns intersection counts for cistrome transcription factor and histone modification ChIP-seq data"
        cistromeIntersection: ChIPSeqIntersections!
        "Returns linked genes"
        linkedGenes: [LinkedGene!]!
        "Returns the intersection data that supports a specific target"
        ccre_target_data(
            target: String!
            target_type: ChIPSeqTargetType!
            eset: IntersectionSource!
        ): [ChIPSeqIntersectionData!]!
    }

    "The celltype-specific z-scores for this ccRE"
    type CTAssayData {
        ct: CellTypeInfo!
        dnase: Float
        h3k4me3: Float
        h3k27ac: Float
        ctcf: Float
    }

    type NearbyGenomic {
        nearby_genes: [NearbyGene!]!
        tads: [CommonGene!]!
        re_tads: [NearbyRE!]!
        nearby_res: [NearbyRE!]!
        overlapping_snps: [NearbySNP!]!
    }

    "A nearby cCRE"
    type NearbyRE {
        "The distance from the ccRE"
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
        CISTROME
    }

    "Info on a cell type used in SCREEN and in ccREs"
    type CellTypeInfo {
        name: String
        value: String!
        tissue: String!
        displayName: String!
        isde: Boolean!
        synonyms: [String!]
        assays: [CellTypeAssay!]
        cCREActivity(ccre: String!): CtSpecific
    }

    "Info on a single assay from a cell type"
    type CellTypeAssay {
        assay: String!
        expid: String!
        fileid: String!
        biosample_summary: String!
        biosample_type: String!
    }

    "Differential expression data"
    type DeResponse {
        gene: DeGene!
        diffcCREs: [DiffcCRE!]!
        "Null if there are no de genes"
        nearbyGenes: [DiffGene!]
        min: Int!
        max: Int!
    }

    "Gene info for de"
    type DeGene {
        "The coordinates of this gene"
        coords: ChromRange!
        "The gene name"
        gene: String!
        "The ensembl id and ver of the gene"
        ensemblid_ver: String!
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
        gene: DeGene!
    }

    "Gene expression data"
    type GeneExpResponse {
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
    type GwasResponse {
        studies: [GwasStudy!]!
        study(study: String!): GwasStudy!
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
        "Total number of LD blocks that overlap ccREs"
        numLdBlocksOverlap: Int!
        "Total number of ccRE that overlap"
        numcCREsOverlap: Int!
        allSNPs: [LDBlockSNP!]!
        topCellTypes: [GwasCellType!]
        ccres("The cell type to get cres for. If null, will get cres for all cell types" cellType: String): [GwasCCRE!]!
    }

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
        "Returns the ccRE that overlaps this SNP, if one exists"
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
        ct: CellTypeInfo!
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
`;

export const resolvers = ({
    Assembly: {
        GRCh38: 'grch38',
        mm10: 'mm10',
    },
    IntersectionSource: {
        ENCODE: 'peak',
        CISTROME: 'cistrome',
    },
    Query: {
        data: resolve_data,
        globals: resolve_globals,
        de_search: resolve_de,
        geneexp_search: resolve_geneexp,
        gwas: resolve_gwas,
        credetails: resolve_credetails,
        rampage: resolve_rampage,
        genetop: resolve_genetop,
        snps: resolve_snps,
    },
    GlobalsResponse: {
        //files: resolve_globals_files,
        inputData: resolve_globals_inputData,
        byAssembly: resolve_globals_assembly,
    },
    AssemblySpecificGlobalsResponse: {
        tfs: resolve_globals_assembly_tfs,
        cellCompartments: resolve_globals_assembly_cellCompartments,
        cellTypeInfoArr: resolve_globals_assembly_cellTypeInfoArr,
        ctinfo: resolve_ctinfo,
        chromCounts: resolve_globals_assembly_chromCounts,
        chromLens: resolve_globals_assembly_chromLens,
        cCREHistBins: resolve_globals_assembly_creHistBins,
        geBiosampleTypes: resolve_globals_assembly_geBiosampleTypes,
        geBiosamples: resolve_globals_assembly_geBiosamples,
        //cCREBedsByCellType: resolve_globals_assembly_cCREBedsByCellType,
        //cCREFiles: resolve_globals_assembly_creFiles,
        inputData: resolve_globals_assembly_inputData,
    },
    cCRE: {
        range: resolve_data_range,
        ctspecific: resolve_data_ctspecific,
        nearbygenes: resolve_data_nearbygenes,
        details: resolve_details,
    },
    cCreDetailsResponse: {
        topTissues: resolve_cre_topTissues,
        nearbyGenomic: resolve_cre_nearbyGenomic,
        //fantom_cat: resolve_cre_fantomCat,
        ortholog: resolve_cre_ortholog,
        tfIntersection: resolve_cre_tfIntersection,
        cistromeIntersection: resolve_cre_cistromeIntersection,
        linkedGenes: resolve_cre_linkedGenes,
        ccre_target_data: resolve_cre_target_data,
        //miniPeaks: resolve_cre_miniPeaks,
    },
    OrthologouscCRE: {
        cCRE: resolve_cre_ortholog_cCRE,
    },
    CellTypeInfo: {
        cCREActivity: resolve_celltypeinfo_ccREActivity,
    },
    GwasResponse: {
        studies: resolve_gwas_studies,
        study: resolve_gwas_study,
        snps: resolve_gwas_snps,
    },
    GwasStudy: {
        numLdBlocksOverlap: resolve_gwas_study_numLdBlocksOverlap,
        numcCREsOverlap: resolve_gwas_study_numCresOverlap,
        allSNPs: resolve_gwas_study_allSNPs,
        topCellTypes: resolve_gwas_study_topCellTypes,
        ccres: resolve_gwas_study_cres,
    },
    SNP: {
        ldblocks: resolve_snps_ldblocks,
        related_studies: resolve_snps_relatedstudies,
        overlapping_cCRE: resolve_snps_overlapping_ccRE,
        nearbygenes: resolve_snps_nearbygenes,
    },
    LDBlock: {
        leadsnp: resolve_gwas_ldblock_leadsnp,
        snps: resolve_gwas_ldblock_snps,
    },
    CommonGene: {
        exons: resolve_gene_exons,
    },
    NearbyGenomic: {
        nearby_genes: resolve_cre_nearbyGenomic_nearbyGenes,
        tads: resolve_cre_nearbyGenomic_genesInTad,
        re_tads: resolve_cre_nearbyGenomic_re_tads,
        nearby_res: resolve_cre_nearbyGenomic_nearbyCREs,
        overlaping_snps: resolve_cre_nearbyGenomic_snps,
    },
} as any) as GraphQLResolverMap;

export const generatedSchema = buildFederatedSchema([{ typeDefs, resolvers }]);
