import { GraphQLString, GraphQLObjectType, GraphQLNonNull, GraphQLList, GraphQLFloat } from 'graphql';
import * as CommonTypes from './CommonSchema';

export const GeneExpGene = new GraphQLObjectType({
    name: 'GeneExpGene',
    description: 'Gene info for gene expression',
    fields: () => ({
        coords: {
            type: new GraphQLNonNull(CommonTypes.ChromRange),
            description: 'The coordinates of this gene',
        },
        gene: {
            type: new GraphQLNonNull(GraphQLString),
            description: 'The gene name',
        },
        ensemblid_ver: {
            type: new GraphQLNonNull(GraphQLString),
            description: 'The ensembl id and ver of the gene',
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
        rID: {
            type: new GraphQLNonNull(GraphQLString),
            description: 'The internal id to identify this replicate',
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
        gene_info: {
            type: GeneExpGene,
            description:
                'Info on the gene queried. If the gene does not exist (like for spike-ins), this will be null.',
        },
        items: {
            type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(ExperimentData))),
            description: 'All experimental data for this gene',
        },
    }),
});

export default GeneExpResponse;
