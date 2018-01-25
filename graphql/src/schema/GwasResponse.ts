import {
    GraphQLObjectType,
    GraphQLList,
    GraphQLString,
    GraphQLNonNull
} from 'graphql';
import { resolve_gwas_gwas, resolve_gwas_study, resolve_gwas_cres } from '../resolvers/gwas';
const GraphQLJSON = require('graphql-type-json');

export const GwasResponse = new GraphQLObjectType({
    name: 'Gwas',
    description: 'GWAS data',
    fields: () => ({
        gwas: {
            type: GraphQLJSON,
            resolve: resolve_gwas_gwas
        },
        study: {
            args: {
                study: { type: new GraphQLNonNull(GraphQLString) },
            },
            type: GraphQLJSON,
            resolve: resolve_gwas_study
        },
        cres: {
            args: {
                study: { type: new GraphQLNonNull(GraphQLString) },
                cellType: { type: new GraphQLNonNull(GraphQLString) }
            },
            type: GraphQLJSON,
            resolve: resolve_gwas_cres
        }
    }),
});

export default GwasResponse;
