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
            type: new GraphQLNonNull(GraphQLString)
        },
        expID: {
            type: new GraphQLNonNull(GraphQLString)
        },
        fdr: {
            type: new GraphQLNonNull(GraphQLFloat)
        },
        pval: {
            type: new GraphQLNonNull(GraphQLFloat)
        },
        ct: {
            type: new GraphQLNonNull(CommonTypes.CellTypeInfo)
        }
    })
});

export const GwasCRE = new GraphQLObjectType({
    name: 'GwasCRE',
    description: 'Contains a cRE for Gwas and associated data',
    fields: () => ({
        cRE: {
            type: new GraphQLNonNull(CommonTypes.cRE)
        },
        geneid: {
            type: new GraphQLNonNull(GraphQLString)
        },
        snps: {
            type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(GraphQLString)))
        },
    })
});

export const GwasStudyResponse = new GraphQLObjectType({
    name: 'GwasStudy',
    description: 'GWAS study data',
    fields: () => ({
        gwas_study: {
            type: new GraphQLNonNull(GraphQLJSON)
        },
        mainTable: {
            type: new GraphQLNonNull(GraphQLJSON)
        },
        topCellTypes: {
            type: new GraphQLList(new GraphQLNonNull(GwasCellType))
        },
        cres: {
            args: {
                cellType: {
                    description: 'The cell type to get cres for. If null, will get cres for all cell types',
                    type: GraphQLString
                }
            },
            type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(GwasCRE))),
            resolve: resolve_gwas_cres
        }
    })
});

export const GwasResponse = new GraphQLObjectType({
    name: 'Gwas',
    description: 'GWAS data',
    fields: () => ({
        gwas: {
            type: new GraphQLNonNull(GraphQLJSON),
            resolve: resolve_gwas_gwas
        },
        study: {
            args: {
                study: { type: new GraphQLNonNull(GraphQLString) },
            },
            type: new GraphQLNonNull(GwasStudyResponse),
            resolve: resolve_gwas_study
        },
    }),
});

export default GwasResponse;
