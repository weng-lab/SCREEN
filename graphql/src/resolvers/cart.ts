import * as Cart from '../db/db_cart';
import * as Utils from '../utils';
import { loadCache } from '../db/db_cache';
import { getCreTable } from '../db/db_cre_table';

const { UserError } = require('graphql-errors');

const getCresForAssembly = async (assembly, accessions) => {
    if (accessions.length === 0) {
        return { cres: [], total: 0 };
    }
    const ctmap = await loadCache(assembly).ctmap();
    return getCreTable(assembly, ctmap, { accessions }, {});
};

const getCres = async cres => {
    const hg19cres = getCresForAssembly(
        'hg19',
        cres.filter(c => c.startsWith('EH37'))
    );
    const mm10cres = getCresForAssembly(
        'mm10',
        cres.filter(c => c.startsWith('EM10'))
    );
    return {
        cres: ([] as any[]).concat((await hg19cres).cres, (await mm10cres).cres),
    };
};

export async function resolve_cart_set(source, args, context) {
    const uuid = args.uuid;
    const accessions = args.accessions;
    const notaccesions = accessions.filter(a => !Utils.isaccession(a));
    if (notaccesions.length > 0) {
        throw new UserError('The following are not accessions: ' + notaccesions.join(', '));
    }
    const cres = await Cart.set(uuid, accessions);
    return getCres(cres);
}

export async function resolve_cart_get(source, args, context) {
    const uuid = args.uuid;
    const cres = await Cart.get(uuid);
    return getCres(cres);
}
