import {
    GraphQLObjectType,
    GraphQLList,
    GraphQLString,
    GraphQLFloat,
    GraphQLNonNull
} from 'graphql';
import { resolve_gwas_gwas, resolve_gwas_study, resolve_gwas_cres } from '../resolvers/gwas';
import * as CommonTypes from './CommonSchema';
const GraphQLJSON = require('graphql-type-json');

export const GwasCellType = new GraphQLObjectType({
    name: 'GwasCellType',
    description: 'Data about a specific cell type in a GWAS study',
    fields: () => ({
        biosample_summary: {
            type: GraphQLString
        },
        expID: {
            type: GraphQLString
        },
        fdr: {
            type: GraphQLFloat
        },
        pval: {
            type: GraphQLFloat
        },
        ct: {
            type: new GraphQLNonNull(CommonTypes.CellTypeInfo)
        }
    })
});

export const GwasStudyResponse = new GraphQLObjectType({
    name: 'GwasStudy',
    description: 'GWAS study data',
    fields: () => ({
        gwas_study: {
            type: GraphQLJSON
        },
        mainTable: {
            type: GraphQLJSON
        },
        topCellTypes: {
            type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(GwasCellType)))
        },
    })
});

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
            type: GwasStudyResponse,
            resolve: resolve_gwas_study
        },
        cres: {
            args: {
                study: { type: new GraphQLNonNull(GraphQLString) },
                cellType: {
                    description: 'The cell type to get cres for. If null, will get cres for all cell types',
                    type: GraphQLString
                }
            },
            type: GraphQLJSON,
            resolve: resolve_gwas_cres
        }
    }),
});

export default GwasResponse;
