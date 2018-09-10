import { GraphQLString, GraphQLObjectType, GraphQLNonNull, GraphQLList, GraphQLFloat, GraphQLBoolean } from 'graphql';
import * as CommonTypes from './CommonSchema';
import {
    resolve_geneexp_items,
    resolve_geneexp_biosample_types,
    resolve_geneexp_cell_compartments,
} from '../resolvers/geneexp';

export const GeneExpBiosample = new GraphQLObjectType({
    name: 'GeneExpBiosample',
    description: 'Represents a single biosample from gene expresion',
    fields: () => ({
        biosample: {
            type: new GraphQLNonNull(GraphQLString),
            description: 'The biosample name',
        },
        tissue: {
            type: new GraphQLNonNull(GraphQLString),
            description: 'The tissue for this biosample',
        },
    }),
});

const ReplicateData = new GraphQLObjectType({
    name: 'ReplicateData',
    description: 'Gene exp data for a replicate in an experiment',
    fields: () => ({
        replicate: {
            type: new GraphQLNonNull(GraphQLString),
            description: 'The replicate number or "mean"',
        },
        rawTPM: {
            type: new GraphQLNonNull(GraphQLFloat),
            description: 'The raw TPM value of the current gene for this replicate',
        },
        logTPM: {
            type: new GraphQLNonNull(GraphQLFloat),
            description: 'The log2 TPM value of the current gene for this replicate',
        },
        rawFPKM: {
            type: new GraphQLNonNull(GraphQLFloat),
            description: 'The raw FPKM value of the current gene for this replicate',
        },
        logFPKM: {
            type: new GraphQLNonNull(GraphQLFloat),
            description: 'The log2 FPKM value of the current gene for this replicate',
        },
    }),
});

const ExperimentData = new GraphQLObjectType({
    name: 'ExperimentData',
    description: 'Gene exp data for an experiment',
    fields: () => ({
        tissue: {
            type: new GraphQLNonNull(GraphQLString),
            description: 'The tissue this experiment is from',
        },
        cellType: {
            type: new GraphQLNonNull(GraphQLString),
            description: 'The cell type this experiment is from',
        },
        expID: {
            type: new GraphQLNonNull(GraphQLString),
            description: 'The ENCODE accession of this experiment',
        },
        ageTitle: {
            type: new GraphQLNonNull(GraphQLString),
            description: 'The age title for this experiment',
        },
        ensemblid_ver: {
            type: new GraphQLNonNull(GraphQLString),
            description: 'The ensemblid with version for this gene',
        },
        gene_name: {
            type: new GraphQLNonNull(GraphQLString),
            description: 'The gene for this expression',
        },
        reps: {
            type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(ReplicateData))),
            description: 'All replicate data (including mean) for this experiment',
        },
    }),
});

export const GeneExpResponse = new GraphQLObjectType({
    name: 'GeneExp',
    description: 'Gene expression data',
    fields: () => ({
        items: {
            type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(ExperimentData))),
            description: 'All experimental data for this gene in the specified conditions.',
            resolve: resolve_geneexp_items,
        },
        // TODO: we could instead request these directly from items, but this has a bit more overhead, because we would request all data from db
        biosample_types: {
            type: new GraphQLNonNull(new GraphQLList(GraphQLString)),
            description: 'A list of all biosample types available in the specified conditions',
            resolve: resolve_geneexp_biosample_types,
        },
        cell_compartments: {
            type: new GraphQLNonNull(new GraphQLList(GraphQLString)),
            description: 'A list of all cell compartments available in the specified conditions',
            resolve: resolve_geneexp_cell_compartments,
        },
    }),
});

export default GeneExpResponse;
