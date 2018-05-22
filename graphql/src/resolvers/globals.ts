import { GraphQLFieldResolver } from 'graphql';
import { loadCache, Compartments, loadGlobalCache } from '../db/db_cache';
import { UserError } from 'graphql-errors';
import { chrom_lengths } from '../constants';

export const resolve_globals = () => ({});
export const resolve_globals_helpKeys = () => loadGlobalCache().helpKeys();

export const resolve_globals_colors = () => loadGlobalCache().colors();

export const resolve_globals_files = () => loadGlobalCache().files();

export const resolve_globals_inputData = () => loadGlobalCache().inputData();

export const resolve_globals_assembly: GraphQLFieldResolver<any, any> = (source, args) => {
    const assembly = args.assembly;
    return {
        assembly,
    };
};

export const resolve_globals_assembly_tfs = source => loadCache(source.assembly).tf_list();

export const resolve_globals_assembly_cellCompartments = source => Compartments;

export const resolve_globals_assembly_cellTypeInfoArr = source =>
    loadCache(source.assembly)
        .datasets()
        .then(d => d.globalCellTypeInfoArr);

export const resolve_globals_assembly_chromCounts = source => loadCache(source.assembly).chromCounts();

export const resolve_globals_assembly_chromLens = source => chrom_lengths[source.assembly];

export const resolve_globals_assembly_creHistBins = source => loadCache(source.assembly).creHist();

export const resolve_globals_assembly_geBiosampleTypes = source => loadCache(source.assembly).geBiosampleTypes();

export const resolve_globals_assembly_geBiosamples = source => loadCache(source.assembly).geBiosamples();

export const resolve_globals_assembly_creBigBedsByCellType = source => loadCache(source.assembly).creBigBeds();

export const resolve_globals_assembly_creFiles = source => loadCache(source.assembly).filesList();

export const resolve_globals_assembly_inputData = source => loadCache(source.assembly).inputData();

export const resolve_help_key: GraphQLFieldResolver<any, any> = async (source, args, context) => {
    const key = args.key;
    const helpKeys = await loadGlobalCache().helpKeys();
    const helpText = helpKeys.all[key];
    if (!helpText) {
        throw new UserError(`Invalid help key: ${key}`);
    }
    return helpText;
};

export const resolve_ctinfo: GraphQLFieldResolver<any, any> = async (source, args) => {
    const cellType = args.cellType;
    if (cellType === 'none') return undefined;
    const result = (await source.cellTypeInfoArr).filter(ct => ct.value === cellType);
    if (result.length == 0) {
        throw new UserError(cellType, ' does not exist!');
    }
    return result[0];
};
