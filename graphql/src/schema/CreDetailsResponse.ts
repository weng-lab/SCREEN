import {
    GraphQLObjectType,
    GraphQLList,
    GraphQLString,
    GraphQLNonNull
} from 'graphql';
import * as CreDetailsResolver from '../resolvers/credetails';
import * as CommonTypes from './CommonSchema';
import { GraphQLFloat, GraphQLInt, GraphQLBoolean } from 'graphql/type/scalars';
import { SNP, Gene } from './SearchResponse';
import { GeneExpGene } from './GeneExpResponse';
const GraphQLJSON = require('graphql-type-json');


export const AssayValues = new GraphQLObjectType({
    name: 'AssayValues',
    description: 'Gets specific values for an assay',
    fields: () => ({
        ct: {
            type: new GraphQLNonNull(CommonTypes.CellTypeInfo)
        },
        one: {
            type: GraphQLFloat
        },
        two: {
            type: GraphQLFloat
        }
    })
});

export const CTAssayData = new GraphQLObjectType({
    name: 'CTAssayData',
    description: 'The celltype-specific z-scores for this ccRE',
    fields: () => ({
        ct: {
            type: new GraphQLNonNull(CommonTypes.CellTypeInfo),
        },
        dnase: {
            type: GraphQLFloat,
        },
        h3k4me3: {
            type: GraphQLFloat,
        },
        h3k27ac: {
            type: GraphQLFloat,
        },
        ctcf: {
            type: GraphQLFloat,
        }
    })
});

const NearbyGene = new GraphQLObjectType({
    name: 'NearbyGene',
    description: 'Distance and gene info for a nearby gene',
    fields: () => ({
        distance: {
            type: new GraphQLNonNull(GraphQLInt),
            description: 'The distance to the ccRE',
        },
        gene: {
            type: new GraphQLNonNull(GeneExpGene),
            description: 'The gene'
        },
        pc: {
            type: new GraphQLNonNull(GraphQLBoolean),
            description: 'Whether or not this gene is protein coding',
        },
    })
});

const NearbyRE = new GraphQLObjectType({
    name: 'NearbyRE',
    description: 'A nearby ccRE',
    fields: () => ({
        distance: {
            type: new GraphQLNonNull(GraphQLInt),
            description: 'The distance from the ccRE',
        },
        ccRE: {
            type: new GraphQLNonNull(CommonTypes.cRE),
        }
    })
});

const NearbySNP = new GraphQLObjectType({
    name: 'NearbySNP',
    description: 'A nearby SNP',
    fields: () => ({
        distance: {
            type: new GraphQLNonNull(GraphQLInt),
            description: 'The distance to the ccRE',
        },
        snp: {
            type: new GraphQLNonNull(SNP),
            description: 'The SNP',
        },
    })
});

export const NearbyGenomic = new GraphQLObjectType({
    name: 'NearbyGenomic',
    fields: () => ({
        nearby_genes: {
            type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(NearbyGene))),
            resolve: CreDetailsResolver.resolve_cre_nearbyGenomic_nearbyGenes,
        },
        tads: {
            type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(GeneExpGene))),
            resolve: CreDetailsResolver.resolve_cre_nearbyGenomic_genesInTad,
        },
        re_tads: {
            type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(NearbyRE))),
            resolve: CreDetailsResolver.resolve_cre_nearbyGenomic_re_tads,
        },
        nearby_res: {
            type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(NearbyRE))),
            resolve: CreDetailsResolver.resolve_cre_nearbyGenomic_nearbyCREs,
        },
        overlapping_snps: {
            type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(NearbySNP))),
            resolve: CreDetailsResolver.resolve_cre_nearbyGenomic_snps,
        },
    })
});

export const ChIPSeqIntersectionData = new GraphQLObjectType({
    name: 'ChIPSeqIntersectionData',
    fields: () => ({
        name: { type :new GraphQLNonNull(GraphQLString) }, 
        n: { type :new GraphQLNonNull(GraphQLInt) }, 
        total: { type :new GraphQLNonNull(GraphQLInt) }, 
    }),
});

export const ChIPSeqIntersections = new GraphQLObjectType({
    name: 'ChIPSeqIntersections',
    fields: () => ({
        tf: {
            type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(ChIPSeqIntersectionData))),
            description: 'ChIP-seq intersections with transcription factors',
        },
        histone: {
            type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(ChIPSeqIntersectionData))),
            description: 'ChIP-seq intersections with histone marks',
        },
    }),
});

export const FantomCatData = new GraphQLObjectType({
    name: 'FantomCatData',
    fields: () => ({
        id: {
            type: new GraphQLNonNull(GraphQLInt),
        },
        range: {
            type: new GraphQLNonNull(CommonTypes.ChromRange),
        },
        geneid: {
            type: new GraphQLNonNull(GraphQLString),
        },
        genename: {
            type: new GraphQLNonNull(GraphQLString),
        },
        aliases: {
            type: new GraphQLNonNull(GraphQLString),
        },
        geneclass: {
            type: new GraphQLNonNull(GraphQLString),
        },
        dhssupport: {
            type: new GraphQLNonNull(GraphQLString),
        },
        genecategory: {
            type: new GraphQLNonNull(GraphQLString),
        },
        tirconservation: {
            type: new GraphQLNonNull(GraphQLFloat),
        },
        exonconservation: {
            type: new GraphQLNonNull(GraphQLFloat),
        },
        traitdfr: {
            type: GraphQLFloat,
        },
        eqtlcoexpr: {
            type: GraphQLFloat,
        },
        dynamicexpr: {
            type: new GraphQLNonNull(GraphQLFloat),
        },
        other_names: {
            type: new GraphQLNonNull(GraphQLString),
        },
    })
});

export const FantomCat = new GraphQLObjectType({
    name: 'FantomCat',
    fields: () => ({
        fantom_cat: {
            type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(FantomCatData))),
        },
        fantom_cat_twokb: {
            type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(FantomCatData))),
        },
    }),
});

const RampageGene = new GraphQLObjectType({
    name: 'RampageGene',
    description: 'Distance and gene info for a nearby gene',
    fields: () => ({
        distance: {
            type: new GraphQLNonNull(GraphQLInt),
            description: 'The distance to the ccRE',
        },
        gene: {
            type: new GraphQLNonNull(GeneExpGene),
            description: 'The gene'
        },
    })
});

export const RampageGeneData = new GraphQLObjectType({
    name: 'RampageGeneData',
    fields: () => ({
        transcripts: {
            type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(RampageTranscript))),
        },
        gene: {
            type: new GraphQLNonNull(RampageGene),
        },
    })
});

export const RampageTranscriptData = new GraphQLObjectType({
    name: 'RampageTranscriptData',
    fields: () => ({
        expid: {
            type: new GraphQLNonNull(GraphQLString),
        },
        fileid: {
            type: new GraphQLNonNull(GraphQLString),
        },
        biosample_term_name: {
            type: new GraphQLNonNull(GraphQLString),
        },
        biosample_type: {
            type: new GraphQLNonNull(GraphQLString),
        },
        biosample_summary: {
            type: new GraphQLNonNull(GraphQLString),
        },
        tissue: {
            type: new GraphQLNonNull(GraphQLString),
        },
        strand: {
            type: new GraphQLNonNull(GraphQLString),
        },
        counts: {
            type: new GraphQLNonNull(GraphQLFloat),
        },
    }),
});

export const RampageTranscript = new GraphQLObjectType({
    name: 'RampageTranscript',
    fields: () => ({
        transcript: {
            type: new GraphQLNonNull(GraphQLString),
        },
        range: {
            type: new GraphQLNonNull(CommonTypes.ChromRange),
        },
        geneinfo: {
            type: new GraphQLNonNull(GraphQLString),
        },
        items: {
            type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(RampageTranscriptData)))
        },
    }),
});

export const OrthologouscRE = new GraphQLObjectType({
    name: 'OrthologouscRE',
    fields: () => ({
        accession: {
            type: new GraphQLNonNull(GraphQLString),
        },
        overlap: {
            type: new GraphQLNonNull(GraphQLInt),
        },
        hg19range: {
            type: new GraphQLNonNull(CommonTypes.ChromRange),
        },
    })
});

export const CreDetailsResponse = new GraphQLObjectType({
    name: 'CreDetails',
    description: 'Get details of various experiments related to this ccRE.',
    fields: () => ({
        info: {
            description: 'Gets the current ccRE data',
            type: new GraphQLNonNull(CommonTypes.cRE),
            resolve: CreDetailsResolver.resolve_cre_info
        },
        topTissues: {
            description: 'Returns celltype-specific experiment data',
            type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(CTAssayData))),
            resolve: CreDetailsResolver.resolve_cre_topTissues
        },
        nearbyGenomic: {
            description: 'Returns nearby genomic elements',
            type: new GraphQLNonNull(NearbyGenomic),
            resolve: CreDetailsResolver.resolve_cre_nearbyGenomic
        },
        fantom_cat: {
            description: 'Returns intersecting FANTOM CAT RNAs',
            type: new GraphQLNonNull(FantomCat),
            resolve: CreDetailsResolver.resolve_cre_fantomCat
        },
        ortholog: {
            description: 'Returns orthologous ccREs',
            type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(OrthologouscRE))),
            resolve: CreDetailsResolver.resolve_cre_ortholog
        },
        tfIntersection: {
            description: 'Returns intersection counts for transcription factor and histone modification ChIP-seq data',
            type: new GraphQLNonNull(ChIPSeqIntersections),
            resolve: CreDetailsResolver.resolve_cre_tfIntersection
        },
        cistromeIntersection: {
            description: 'Returns intersection counts for cistrome transcription factor and histone modification ChIP-seq data',
            type: GraphQLJSON,
            resolve: CreDetailsResolver.resolve_cre_cistromeIntersection
        },
        rampage: {
            description: 'Returns RAMPAGE data of closest gene',
            type: new GraphQLNonNull(RampageGeneData),
            resolve: CreDetailsResolver.resolve_cre_rampage
        },
        linkedGenes: {
            description: 'Returns linked genes',
            type: GraphQLJSON,
            resolve: CreDetailsResolver.resolve_cre_linkedGenes
        },
        cre_tf_dcc: {
            description: 'Returns transcription factor intersections for a specific target',
            type: GraphQLJSON,
            args: {
                target: { type: new GraphQLNonNull(GraphQLString) },
                eset: { type: new GraphQLNonNull(GraphQLString) },
            },
            resolve: CreDetailsResolver.resolve_cre_tf_dcc
        },
        cre_histone_dcc: {
            description: 'Returns histone intersections for a specific target',
            type: GraphQLJSON,
            args: {
                target: { type: new GraphQLNonNull(GraphQLString) },
                eset: { type: new GraphQLNonNull(GraphQLString) },
            },
            resolve: CreDetailsResolver.resolve_cre_histone_dcc
        },
        miniPeaks: {
            description: 'Returns signal profile data',
            type: GraphQLJSON,
            resolve: CreDetailsResolver.resolve_cre_miniPeaks
        },
    }),
});

export default CreDetailsResponse;
