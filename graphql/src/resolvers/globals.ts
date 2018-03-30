import { GraphQLFieldResolver } from 'graphql';
import { global_data_global, global_data } from '../db/db_cache';
import { UserError } from 'graphql-errors';


export const resolve_globals: GraphQLFieldResolver<any, any> = (source, args, context) => {
    return global_data_global();
};

export const resolve_globals_assembly: GraphQLFieldResolver<any, any> = (source, args, context) => {
    const assembly = args.assembly;
    return global_data(assembly);
};

export const resolve_help_key: GraphQLFieldResolver<any, any> = (source, args, context) => {
    const key = args.key;
    const helpKeys = global_data_global().helpKeys;
    const helpText = helpKeys.all[key];
    if (!helpText) {
        throw new UserError(`Invalid help key: ${key}`);
    }
    return helpText;
};

export const resolve_ctinfo: GraphQLFieldResolver<any, any> = (source, args) => {
    const cellType = args.cellType;
    if (cellType === 'none') return undefined;
    const result = source.cellTypeInfoArr.filter(ct => ct.value === cellType);
    if (result.length == 0) {
        throw new UserError(cellType, ' does not exist!');
    }
    return result[0];
};
