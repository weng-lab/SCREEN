import DataLoader from 'dataloader';

import { chroms, chrom_lengths } from './constants';
import { Assembly } from './types';

export const assemblies: Assembly[] = ['grch38', 'mm10'];

const starts = {
    mm10: 'em10e',
    hg19: 'eh37e',
    GRCh38: 'eh38e',
};
export const isaccession = (s: string) => {
    if (s.length != 12) {
        return false;
    }
    s = s.toLowerCase();
    // TODO: double check using regex
    return s.startsWith('eh37e') || s.startsWith('em10e') || s.startsWith('eh38e');
};

export const isclose = (a, b) => Math.abs(a - b) < Number.EPSILON;

const natsortcollator = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' });
export const natsorter = natsortcollator.compare;

export const natsort = array => {
    return array.slice().sort(natsorter);
};

export const checkCreAssembly = (assembly: Assembly, accession: string) => accession.toLowerCase().startsWith(starts[assembly]);

export const getAssemblyFromCre = (accession): Assembly | undefined => {
    const cre = accession.toLowerCase();
    if (cre.startsWith('em10e')) {
        return 'mm10';
    } else if (cre.startsWith('eh38e')) {
        return 'grch38';
    }
    return undefined;
};

export const checkChrom = (assembly, chrom) => {
    const achroms = chroms[assembly];
    if (!achroms.includes(chrom)) {
        throw new Error('unknown chrom ' + chrom);
    }
    return chrom;
};

// from https://github.com/substack/deep-freeze
export const deepFreeze = o => {
    Object.freeze(o);
    Object.getOwnPropertyNames(o).forEach(prop => {
        if (
            o.hasOwnProperty(prop) &&
            o[prop] !== null &&
            (typeof o[prop] === 'object' || typeof o[prop] === 'function') &&
            !Object.isFrozen(o[prop])
        ) {
            deepFreeze(o[prop]);
        }
    });
    return o;
};

export const escapeRegExp = str => str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, '\\$&');

export const reduceAsKeys = <T extends string = string, V = any>(array: T[], mapper: (key: T) => V): Record<T, V> => {
    return array.reduce(
        (prev, key) => {
            prev[key] = mapper(key);
            return prev;
        },
        {} as Record<T, V>
    );
};

export const createDataLoader = <K, V>(f: (assembly: Assembly, keys: readonly K[]) => Promise<V[]>): Record<Assembly, DataLoader<K, V>> => reduceAsKeys(assemblies, (assembly: Assembly) => new DataLoader<K, V>(keys => f(assembly, keys)));

const ensemblid_nover_regexp = /ENSMUS[GT]\d+/;
export const removeEnsemblVer = (ver_string: string) => {
    const match = ver_string.match(ensemblid_nover_regexp);
    if (!match) {
        throw new Error('No match');
    }
    return match[0];
};

export function checkCoords(assembly: Assembly, coord): boolean {
    if (!(coord.chrom in chrom_lengths[assembly])) {
        throw new Error(`Invalid chromosome ${coord.chrom}`);
    }
    if (coord.start < 0) {
        throw new Error(`Invalid start position. Should be >=0.`)
    }
    const chrom_end = chrom_lengths[assembly][coord.chrom];
    if (coord.end > chrom_end) {
        throw new Error(`Invalid end position (${coord.end}). End of chromosome (${coord.chrom}) is ${chrom_end}`);
    }
    return true;
}

export const cleanBiosampleName = (biosample: string) => biosample.replace(' ', '_');