import * as Cart from '../db/db_cart';
import * as Utils from '../utils';

const { UserError } = require('graphql-errors')

export async function resolve_cart_set(source, args, context) {
    const uuid = args.uuid;
    const accessions = args.accessions;
    const notaccesions = accessions.filter(a => !Utils.isaccession(a));
    if (notaccesions.length > 0) {
        throw new UserError('The following are not accessions: ' + notaccesions.join(', '));
    }
    return { accessions: Cart.set(uuid, accessions) };
}

export async function resolve_cart_get(source, args, context) {
    const uuid = args.uuid;
    return { accessions: Cart.get(uuid) };
}
