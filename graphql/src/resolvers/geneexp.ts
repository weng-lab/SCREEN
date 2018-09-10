import { GraphQLFieldResolver, Source } from 'graphql';
import * as Common from '../db/db_common';
import * as DbGene from '../db/db_geneexp';

import { loadCache } from '../db/db_cache';
import { Assembly } from '../types';
import { UserError } from 'graphql-errors';

type GeneExpArgs = {
    assembly: Assembly;
    gene: string | null;
    biosample: string | null;
    biosample_types: string[] | null;
    compartments: string[] | null;
    experimentaccession: string | null;
    normalized: boolean | null;
    pconly: boolean | null;
    nomitochondrial: boolean | null;
};

export const resolve_geneexp_items: GraphQLFieldResolver<{ args: GeneExpArgs }, any, {}> = async (
    source,
    args,
    context
) => {
    const sourceargs = source.args;
    const assembly = sourceargs.assembly;
    const gene = sourceargs.gene;
    const biosample = sourceargs.biosample;
    let biosample_types = sourceargs.biosample_types;
    let compartments = sourceargs.compartments;
    const experimentaccession = sourceargs.experimentaccession;
    const normalized = typeof sourceargs.normalized === 'boolean' ? sourceargs.normalized : false;
    const pconly = typeof sourceargs.pconly === 'boolean' ? sourceargs.pconly : false;
    const nomitochondrial = typeof sourceargs.nomitochondrial === 'boolean' ? sourceargs.nomitochondrial : false;

    if (!gene && !biosample && !experimentaccession) {
        throw new UserError('Must include either gene, biosample, or experimentaccession');
    }

    const geBiosampleTypes = await loadCache(assembly).geBiosampleTypes();

    const available_biosamples = geBiosampleTypes;
    if (!biosample_types) {
        biosample_types = available_biosamples;
    } else if (biosample_types.some(b => available_biosamples.indexOf(b) === -1)) {
        throw new UserError(
            'invalid biosample types: ' + biosample_types.filter(b => available_biosamples.indexOf(b) === -1).join(',')
        );
    }

    const available_compartments = await loadCache(assembly).geCellCompartments();
    if (!compartments) {
        compartments = available_compartments;
    } else if (compartments.some(b => available_compartments.indexOf(b) === -1)) {
        throw new UserError(
            'invalid biosample types: ' + compartments.filter(b => available_compartments.indexOf(b) === -1).join(',')
        );
    }

    let name = gene;
    if (gene) {
        const rows = await Common.geneInfo(assembly, gene);
        if (rows.length !== 0) {
            const gi = rows[0];
            name = gi.approved_symbol;
        }
    }

    const items = await DbGene.geneexp(
        assembly,
        name as any,
        biosample as any,
        experimentaccession as any,
        compartments,
        biosample_types,
        normalized,
        pconly,
        nomitochondrial
    );
    return items;
};

export const resolve_geneexp_biosample_types: GraphQLFieldResolver<{ args: GeneExpArgs }, any, {}> = async (
    source,
    args,
    context
) => {
    const sourceargs = source.args;
    const assembly = sourceargs.assembly;
    const gene = sourceargs.gene;
    const biosample = sourceargs.biosample;
    let biosample_types = sourceargs.biosample_types;
    let compartments = sourceargs.compartments;
    const experimentaccession = sourceargs.experimentaccession;
    const normalized = typeof sourceargs.normalized === 'boolean' ? sourceargs.normalized : false;
    const pconly = typeof sourceargs.pconly === 'boolean' ? sourceargs.pconly : false;
    const nomitochondrial = typeof sourceargs.nomitochondrial === 'boolean' ? sourceargs.nomitochondrial : false;

    if (!gene && !biosample && !experimentaccession) {
        throw new UserError('Must include either gene, biosample, or experimentaccession');
    }

    const geBiosampleTypes = await loadCache(assembly).geBiosampleTypes();

    const available_biosamples = geBiosampleTypes;
    if (!biosample_types) {
        biosample_types = available_biosamples;
    } else if (biosample_types.some(b => available_biosamples.indexOf(b) === -1)) {
        throw new UserError(
            'invalid biosample types: ' + biosample_types.filter(b => available_biosamples.indexOf(b) === -1).join(',')
        );
    }

    const available_compartments = await loadCache(assembly).geCellCompartments();
    if (!compartments) {
        compartments = available_compartments;
    } else if (compartments.some(b => available_compartments.indexOf(b) === -1)) {
        throw new UserError(
            'invalid biosample types: ' + compartments.filter(b => available_compartments.indexOf(b) === -1).join(',')
        );
    }

    let name = gene;
    if (gene) {
        const rows = await Common.geneInfo(assembly, gene);
        if (rows.length !== 0) {
            const gi = rows[0];
            name = gi.approved_symbol;
        }
    }

    return DbGene.biosample_types(
        assembly,
        name as any,
        biosample as any,
        experimentaccession as any,
        compartments,
        biosample_types,
        normalized,
        pconly,
        nomitochondrial
    );
};

export const resolve_geneexp_cell_compartments: GraphQLFieldResolver<{ args: GeneExpArgs }, any, {}> = async (
    source,
    args,
    context
) => {
    const sourceargs = source.args;
    const assembly = sourceargs.assembly;
    const gene = sourceargs.gene;
    const biosample = sourceargs.biosample;
    let biosample_types = sourceargs.biosample_types;
    let compartments = sourceargs.compartments;
    const experimentaccession = sourceargs.experimentaccession;
    const normalized = typeof sourceargs.normalized === 'boolean' ? sourceargs.normalized : false;
    const pconly = typeof sourceargs.pconly === 'boolean' ? sourceargs.pconly : false;
    const nomitochondrial = typeof sourceargs.nomitochondrial === 'boolean' ? sourceargs.nomitochondrial : false;

    if (!gene && !biosample && !experimentaccession) {
        throw new UserError('Must include either gene, biosample, or experimentaccession');
    }

    const geBiosampleTypes = await loadCache(assembly).geBiosampleTypes();

    const available_biosamples = geBiosampleTypes;
    if (!biosample_types) {
        biosample_types = available_biosamples;
    } else if (biosample_types.some(b => available_biosamples.indexOf(b) === -1)) {
        throw new UserError(
            'invalid biosample types: ' + biosample_types.filter(b => available_biosamples.indexOf(b) === -1).join(',')
        );
    }

    const available_compartments = await loadCache(assembly).geCellCompartments();
    if (!compartments) {
        compartments = available_compartments;
    } else if (compartments.some(b => available_compartments.indexOf(b) === -1)) {
        throw new UserError(
            'invalid biosample types: ' + compartments.filter(b => available_compartments.indexOf(b) === -1).join(',')
        );
    }

    let name = gene;
    if (gene) {
        const rows = await Common.geneInfo(assembly, gene);
        if (rows.length !== 0) {
            const gi = rows[0];
            name = gi.approved_symbol;
        }
    }

    return DbGene.cell_compartments(
        assembly,
        name as any,
        biosample as any,
        experimentaccession as any,
        compartments,
        biosample_types,
        normalized,
        pconly,
        nomitochondrial
    );
};

export const resolve_geneexp: GraphQLFieldResolver<any, any, GeneExpArgs> = async (source, args, context) => {
    return {
        args,
    };
};
