import {
    GraphQLObjectType,
    GraphQLList,
    GraphQLString,
    GraphQLNonNull
} from 'graphql';
import * as CreDetailsResolver from '../resolvers/credetails';
import * as CommonTypes from './CommonSchema';
import { GraphQLFloat } from 'graphql/type/scalars';
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
})

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
            type: GraphQLJSON,
            resolve: CreDetailsResolver.resolve_cre_nearbyGenomic
        },
        fantom_cat: {
            description: 'Returns intersecting FANTOM CAT RNAs',
            type: GraphQLJSON,
            resolve: CreDetailsResolver.resolve_cre_fantomCat
        },
        ortholog: {
            description: 'Returns orthologous ccREs',
            type: GraphQLJSON,
            resolve: CreDetailsResolver.resolve_cre_ortholog
        },
        tfIntersection: {
            description: 'Returns intersection counts for transcription factor and histone modification ChIP-seq data',
            type: GraphQLJSON,
            resolve: CreDetailsResolver.resolve_cre_tfIntersection
        },
        cistromeIntersection: {
            description: 'Returns intersection counts for cistrome transcription factor and histone modification ChIP-seq data',
            type: GraphQLJSON,
            resolve: CreDetailsResolver.resolve_cre_cistromeIntersection
        },
        rampage: {
            description: 'Returns RAMPAGE data of closest gene',
            type: GraphQLJSON,
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
