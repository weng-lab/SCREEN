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
    fields: () => ({
        cRE: { type: GraphQLString },
        info: {
            type: CommonTypes.cRE,
            resolve: CreDetailsResolver.resolve_cre_info
        },
        topTissues: {
            type: GraphQLJSON,
            resolve: CreDetailsResolver.resolve_cre_topTissues
        },
        nearbyGenomic: {
            type: GraphQLJSON,
            resolve: CreDetailsResolver.resolve_cre_nearbyGenomic
        },
        fantom_cat: {
            type: GraphQLJSON,
            resolve: CreDetailsResolver.resolve_cre_fantomCat
        },
        ortholog: {
            type: GraphQLJSON,
            resolve: CreDetailsResolver.resolve_cre_ortholog
        },
        tfIntersection: {
            type: GraphQLJSON,
            resolve: CreDetailsResolver.resolve_cre_tfIntersection
        },
        cistromeIntersection: {
            type: GraphQLJSON,
            resolve: CreDetailsResolver.resolve_cre_cistromeIntersection
        },
        rampage: {
            type: GraphQLJSON,
            resolve: CreDetailsResolver.resolve_cre_rampage
        },
        linkedGenes: {
            type: GraphQLJSON,
            resolve: CreDetailsResolver.resolve_cre_linkedGenes
        },
        cre_tf_dcc: {
            type: GraphQLJSON,
            args: {
                target: { type: new GraphQLNonNull(GraphQLString) },
                eset: { type: new GraphQLNonNull(GraphQLString) },
            },
            resolve: CreDetailsResolver.resolve_cre_tf_dcc
        },
        cre_histone_dcc: {
            type: GraphQLJSON,
            args: {
                target: { type: new GraphQLNonNull(GraphQLString) },
                eset: { type: new GraphQLNonNull(GraphQLString) },
            },
            resolve: CreDetailsResolver.resolve_cre_histone_dcc
        },
        miniPeaks: {
            type: GraphQLJSON,
            resolve: CreDetailsResolver.resolve_cre_miniPeaks
        },
    }),
});

export default CreDetailsResponse;
