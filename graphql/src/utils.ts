import { chroms } from './constants';

const starts = {
    mm10: 'em10e',
    hg19: 'eh37e',
    hg38: 'eh38e',
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

const assemblies = ['hg19', 'mm10'];
export const checkAssembly = j => {
    const assembly = j['assembly'];
    if (!assembly) {
        throw new Error('assembly not defined');
    }
    if (!(assembly in assemblies)) {
        throw new Error('invalid assembly ' + assembly);
    }
    return assembly;
};

export const checkCreAssembly = (assembly, accession) => accession.startsWith(starts[assembly]);

export const getAssemblyFromCre = accession => {
    const cre = accession.toLowerCase();
    if (cre.startsWith('eh37e')) {
        return 'hg19';
    } else if (cre.startsWith('em10e')) {
        return 'mm10';
    } else if (cre.startsWith('eh38e')) {
        return 'hg38';
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
