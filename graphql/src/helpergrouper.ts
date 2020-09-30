import TissueColors from './tissuecolors';
import { natsorter } from './utils';

export default class HelperGrouper {
    transcript;
    rows: Array<object>;
    byID;

    constructor(transcript, rows) {
        this.transcript = transcript;
        this.rows = rows;
        this.byID = this.rows.reduce((obj, r) => ({ ...obj, [r['id']]: r }), {});

        for (const rid of Object.keys(this.byID)) {
            const r = this.byID[rid];
            r['color'] = TissueColors.getTissueColor(r['tissue']);
            r['counts'] = +r['counts'];
        }
    }

    getGroupedItems(skey) {
        return {
            byTissue: this.groupByTissue(skey),
            byTissueMax: this.groupByTissueMax(skey),
            byValue: this.sortByValue(skey),
        };
    }

    static sortByKey = skey => (a, b) => natsorter(a[skey], b[skey]);
    static sortByTissue = HelperGrouper.sortByKey('tissue');
    static sortByKeyThenTissue = skey => (a, b) =>
        HelperGrouper.sortByKey(skey)(a, b) === 0 ? 0 : HelperGrouper.sortByTissue(a, b);

    groupByTissue(skey) {
        this.rows.sort(HelperGrouper.sortByTissue);

        const ret: any = {};
        for (const row of this.rows) {
            const t = row['tissue'];
            if (!(t in ret)) {
                ret[t] = {
                    name: t,
                    tissue: t,
                    color: row['color'],
                    items: [],
                };
            }
            ret[t]['items'].push(row['id']);
        }

        for (const k of Object.keys(ret)) {
            ret[k]['items'].sort(HelperGrouper.sortByKeyThenTissue(skey)).reverse();
        }
        const sortedkeys = Object.keys(ret).sort(natsorter);
        return sortedkeys.map(tissue => ret[tissue]);
    }

    static pad = (n, width) => {
        n = n + '';
        return n.length >= width ? n : new Array(width - n.length + 1).join('0') + n;
    };

    groupByTissueMax(skey) {
        this.rows.sort(HelperGrouper.sortByTissue);

        const ret: any = {};
        for (const row of this.rows) {
            const t = row['tissue'];
            if (!(t in ret)) {
                ret[t] = {
                    name: t,
                    tissue: t,
                    color: row['color'],
                    items: [row['id']],
                };
            }
            if (this.byID[ret[t]['items'][0]][skey] < row[skey]) {
                ret[t]['items'] = [row['id']];
            }
        }

        const rows = Object.keys(ret).map(k => ret[k]);
        const sorter = (a, b) => natsorter(this.byID[a['items'][0]][skey], this.byID[b['items'][0]][skey]);
        rows.sort(sorter).reverse();

        return rows;
    }

    sortByValue(skey) {
        this.rows.sort(HelperGrouper.sortByKey(skey)).reverse();

        return this.rows.map((row, idx) => ({
            name: idx + '_' + row['tissue'],
            tissue: row['tissue'],
            color: row['color'],
            items: [row['id']],
        }));
    }
}
