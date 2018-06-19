import * as search from '../src/resolvers/search';

describe('find_coords', () => {
    test('range single token', () => {
        expect(search.find_coords('hg19', 'chr1:1-100')).toEqual(
            { coords: [
                { assembly: 'hg19', input: 'chr1:1-100', sm:1, range: { chrom: 'chr1', start: 1, end: 100} },
            ], s: '' }
        );
    });

    test('base single token', () => {
        expect(search.find_coords('hg19', 'chr1:1')).toEqual(
            { coords: [
                { assembly: 'hg19', input: 'chr1:1', sm:1, range: { chrom: 'chr1', start: 1, end: 2} },
            ], s: ''}
        );
    });

    test('chr single token', () => {
        expect(search.find_coords('hg19', 'chr1')).toEqual(
            { coords: [
                { assembly: 'hg19', input: 'chr1', sm:1, range: { chrom: 'chr1', start: 1, end: 249250621} },
            ], s: ''}
        );
    });

    test('range two token', () => {
        expect(search.find_coords('hg19', 'chr1:1-100 chr2:1-100')).toEqual(
            { coords: [
                { assembly: 'hg19', input: 'chr1:1-100', sm:1, range: { chrom: 'chr1', start: 1, end: 100} },
                { assembly: 'hg19', input: 'chr2:1-100', sm:1, range: { chrom: 'chr2', start: 1, end: 100} },
            ], s: '' }
        );
    });

    test('base two token', () => {
        expect(search.find_coords('hg19', 'chr1:1 chr2:1')).toEqual(
            { coords: [
                { assembly: 'hg19', input: 'chr1:1', sm:1, range: { chrom: 'chr1', start: 1, end: 2} }, 
                { assembly: 'hg19', input: 'chr2:1', sm:1, range: { chrom: 'chr2', start: 1, end: 2} },
            ], s: ''}
        );
    });

    test('chr two token', () => {
        expect(search.find_coords('hg19', 'chr1 chr2')).toEqual(
            { coords: [
                { assembly: 'hg19', input: 'chr1', sm:1, range: { chrom: 'chr1', start: 1, end: 249250621} }, 
                { assembly: 'hg19', input: 'chr2', sm:1, range: { chrom: 'chr2', start: 1, end: 243199373} },
            ], s: ''});
    });

    test('range one split token', () => {
        expect(search.find_coords('hg19', 'chr1 1-100')).toEqual(
            { coords: [
                { assembly: 'hg19', input: 'chr1 1-100', sm:1, range: { chrom: 'chr1', start: 1, end: 100} },
            ], s: '' });
    });

    test('range split intterupted', () => {
        expect(search.find_coords('hg19', 'chr1 K562 1-100')).toEqual(
            { coords: [
                { assembly: 'hg19', input: 'chr1', sm:1, range: { chrom: 'chr1', start: 1, end: 249250621} },
            ], s: 'K562 1-100' });
    });

    test('range split intterupted plus extra', () => {
        expect(search.find_coords('hg19', 'chr1 K562 1-100 chr2 2-101')).toEqual(
            { coords: [
                { assembly: 'hg19', input: 'chr1', sm:1, range: { chrom: 'chr1', start: 1, end: 249250621} },
                { assembly: 'hg19', input: 'chr2 2-101', sm:1, range: { chrom: 'chr2', start: 2, end: 101} },
            ], s: 'K562 1-100' });
    });

    test('complex', () => {
        expect(search.find_coords('hg19', 'chr1 K562 1 100 chr2 2-101 chr3 1 A549 chr4:1 50')).toEqual(
            { coords: [
                { assembly: 'hg19', input: 'chr1', sm:1, range: { chrom: 'chr1', start: 1, end: 249250621} },
                { assembly: 'hg19', input: 'chr2 2-101', sm:1, range: { chrom: 'chr2', start: 2, end: 101} },
                { assembly: 'hg19', input: 'chr3 1', sm:1, range: { chrom: 'chr3', start: 1, end: 2} },
                { assembly: 'hg19', input: 'chr4:1 50', sm:1, range: { chrom: 'chr4', start: 1, end: 50} },
            ], s: 'K562 1 100 A549' }
        );
    });
});

describe('find_accessions', () => {
    test('simple', async () => {
        const data = await search.find_accessions('hg19', 'EH37E1103372');
        expect(data).toEqual(
            { accessions: [
                { assembly: 'hg19', input: 'EH37E1103372', sm:1, accession: 'EH37E1103372' },
            ], s: '' }
        );
    });

    test('simple two', async () => {
        const data = await search.find_accessions('hg19', 'EH37E1103372 EH37E0252860');
        expect(data).toEqual(
            { accessions: [
                { assembly: 'hg19', input: 'EH37E1103372', sm:1, accession: 'EH37E1103372' },
                { assembly: 'hg19', input: 'EH37E0252860', sm:1, accession: 'EH37E0252860' },
            ], s: '' }
        );
    });

    test('simple plus more', async () => {
        const data = await search.find_accessions('hg19', 'EH37E1103372 K562 chr1');
        expect(data).toEqual(
            { accessions: [
                { assembly: 'hg19', input: 'EH37E1103372', sm:1, accession: 'EH37E1103372' },
            ], s: 'K562 chr1' });
    });

    test('simple two intterupted', async () => {
        const data = await search.find_accessions('hg19', 'EH37E1103372 K562 EH37E0252860');
        expect(data).toEqual(
            { accessions: [
                { assembly: 'hg19', input: 'EH37E1103372', sm:1, accession: 'EH37E1103372' },
                { assembly: 'hg19', input: 'EH37E0252860', sm:1, accession: 'EH37E0252860' },
            ], s: 'K562' }
        );
    });

    test('case', async () => {
        const data = await search.find_accessions('hg19', 'eh37E1103372 K562 Eh37e0252860');
        expect(data).toEqual(
            { accessions: [
                { assembly: 'hg19', input: 'eh37E1103372', sm:1, accession: 'EH37E1103372' },
                { assembly: 'hg19', input: 'Eh37e0252860', sm:1, accession: 'EH37E0252860' },
            ], s: 'K562' }
        );
    });
});

describe('find_snps', () => {
    test('simple', async () => {
        expect.assertions(1);
        const data = await search.find_snps('hg19', 'rs367896724');
        expect(data).toEqual(
            { snps: [
                { assembly: 'hg19', input: 'rs367896724', sm:1, snp: { id: 'rs367896724' , range: { chrom: 'chr1', start: 10177, end: 10177} } },
            ], s: '' }
        );
    });

    test('simple wrong assembly', async () => {
        const data = await search.find_snps('mm10', 'rs367896724', false);
        expect(data).toEqual(
            { snps: [
            ], s: '' }
        );
    });
});
