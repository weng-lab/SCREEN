import {
    GraphQLObjectType,
    GraphQLList,
    GraphQLString,
    GraphQLNonNull
} from 'graphql';
import * as CreDetailsResolver from '../resolvers/credetails';
import * as CommonTypes from './CommonSchema';
const GraphQLJSON = require('graphql-type-json');


export const CreDetailsResponse = new GraphQLObjectType({
    name: 'CreDetails',
    description: 'Get details of various experiments related to this ccRE.',
    fields: () => ({
        info: {
            description: 'Gets the current ccRE data',
            type: CommonTypes.cRE,
            resolve: CreDetailsResolver.resolve_cre_info
        },
        topTissues: {
            description: 'Returns celltype-specific experiment data',
            type: GraphQLJSON,
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
