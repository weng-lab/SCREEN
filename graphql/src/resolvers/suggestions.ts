import { GraphQLFieldResolver } from 'graphql';
import * as Suggestions from '../db/db_suggestions';

async function suggestions(query, assemblies) {
    assemblies = assemblies || ['hg19', 'mm10'];
    const p = query.split(' ');
    const results: Array<string> = [];
    for (let i = 0; i <= p.length; i++) {
        const prefix = p.slice(0, i).join(' ');
        const suffix = p.slice(i, p.length).join(' ');
        if (suffix === '') continue;
        for (const assembly of assemblies) {
            results.push(...await Suggestions.get_suggestions(assembly, suffix));
        }
        if (results.length > 0) {
            const pre = prefix === '' ? '' : prefix + ' ';
            return { suggestions: results.map(r => pre + r).sort() };
        }
    }
    return [];
}

export const resolve_suggestions: GraphQLFieldResolver<any, any> = (source, args, context) => {
    const query = args.query;
    const assemblies = args.assemblies;
    return suggestions(query, assemblies);
};
