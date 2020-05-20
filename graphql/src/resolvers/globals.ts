import { GraphQLFieldResolver } from 'graphql';
import { loadCache, loadGlobalCache } from '../db/db_cache';
import { Resolver, Assembly } from '../types';
import { chrom_lengths } from '../constants';

export const resolve_globals = () => ({});
export const resolve_globals_helpKeys = () => loadGlobalCache().helpKeys();

export const resolve_globals_colors = () => loadGlobalCache().colors();

export const resolve_globals_files = () => loadGlobalCache().files();

export const resolve_globals_inputData = () => loadGlobalCache().inputData();

export const resolve_globals_assembly: Resolver<{ assembly: Assembly }> = (source, args) => {
    const assembly = args.assembly;
    return {
        assembly,
    };
};

export const resolve_globals_assembly_tfs = source => loadCache(source.assembly).tf_list();

export const resolve_globals_assembly_cellCompartments = source => loadCache(source.assembly).geCellCompartments();

export const resolve_globals_assembly_biosamples = source =>
    loadCache(source.assembly)
        .datasets()
        .then(d => d.globalCellTypeInfoArr);

export const resolve_globals_assembly_chromCounts = source => loadCache(source.assembly).chromCounts();

export const resolve_globals_assembly_chromLens = source => chrom_lengths[source.assembly];

export const resolve_globals_assembly_creHistBins = source => loadCache(source.assembly).creHist();

export const resolve_globals_assembly_geBiosampleTypes = source => loadCache(source.assembly).geBiosampleTypes();

export const resolve_globals_assembly_geBiosamples = source => loadCache(source.assembly).geBiosamples();

export const resolve_globals_assembly_cCREBedsByCellType = source => loadCache(source.assembly).ccreBeds();

export const resolve_globals_assembly_creFiles = source => loadCache(source.assembly).filesList();

export const resolve_globals_assembly_inputData = source => loadCache(source.assembly).inputData();

export const resolve_help_key: GraphQLFieldResolver<any, any> = async (source, args, context) => {
    const key = args.key;
    const helpKeys = await loadGlobalCache().helpKeys();
    const helpText = helpKeys.all[key];
    if (!helpText) {
        throw new Error(`Invalid help key: ${key}`);
    }
    return helpText;
};

export const resolve_globals_assembly_biosample: Resolver<{ biosample: string }, { assembly: Assembly }> = async (
    source,
    args
) => {
    const biosample = args.biosample;
    const cellTypeInfoArr = await loadCache(source.assembly)
        .datasets()
        .then(d => d.globalCellTypeInfoArr);
    const result = cellTypeInfoArr.filter(ct => ct.value === biosample || ct.name === biosample);
    if (result.length == 0) {
        throw new Error(`${biosample} does not exist!`);
    }
    return result[0];
};

export const globalsResolvers = {
    Globals: {
        //files: resolve_globals_files,
        inputData: resolve_globals_inputData,
        byAssembly: resolve_globals_assembly,
    },
    AssemblySpecificGlobals: {
        tfs: resolve_globals_assembly_tfs,
        cellCompartments: resolve_globals_assembly_cellCompartments,
        biosamples: resolve_globals_assembly_biosamples,
        biosample: resolve_globals_assembly_biosample,
        chromCounts: resolve_globals_assembly_chromCounts,
        chromLens: resolve_globals_assembly_chromLens,
        cCREHistBins: resolve_globals_assembly_creHistBins,
        geBiosampleTypes: resolve_globals_assembly_geBiosampleTypes,
        geBiosamples: resolve_globals_assembly_geBiosamples,
        //cCREBedsByCellType: resolve_globals_assembly_cCREBedsByCellType,
        //cCREFiles: resolve_globals_assembly_creFiles,
        inputData: resolve_globals_assembly_inputData,
    },
};
