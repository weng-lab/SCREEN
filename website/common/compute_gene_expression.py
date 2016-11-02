import sys, os, json

class ComputeGeneExpression:
    def __init__(self, es, ps, cache):
        self.es = es
        self.ps = ps
        self.cache = cache

    def filter(self, rows):
        ret = []
        for row in rows:
            r = [row[0], row[1]]
            if '{}' == r[1]:
                r[1] = "na"
            ret.append(r)
        return ret

    def process(self, curs, gene, rows, f):
        rows = filter(rows)
        sorter = lambda x: x[1]
        rows.sort(key = sorter)

        count = 0
        for organ, tpms in groupby(rows, sorter):
            tpms = [float(x[0]) for x in list(tpms)]
            a = np.array(tpms)
            a = np.log10(a + 0.01)
            qs = np.around(mquantiles(a), 2)
            a = np.around(a, 2)
            f.write('\t'.join(str(x) for x in
                              [gene, organ, qs[0], qs[1], qs[2], np.amin(a), np.amax(a)]) +
                      '\n')
            count += 1
        return count

    def processGenes(self, curs, fnp):
        curs.execute("""
    SELECT DISTINCT(gene_name) from r_expression""")
        genes = curs.fetchall()

        with open(fnp, 'w') as f:
            count = 0
            for idx, gene in enumerate(genes):
                gene = gene[0]
                print(idx + 1, 'of', len(genes), gene)
                curs.execute("""
    select r.tpm, r_rnas.organ
    from r_expression as r
    inner join r_rnas on r_rnas.encode_id = r.dataset
    where gene_name = %(gene)s""",
                             { "gene" : gene })
                rows = curs.fetchall()
                count += process(curs, gene, rows, f)
        print("created", count, "rows")

        with open(fnp) as f:
            curs.copy_from(f, "r_box_plots", '\t',
                           columns=("gene", "organ", "q1", "q2", "q3",
                                    "whisker_low", "whisker_high"))
        print("imported", fnp)

    def compute(self, gene):
        with getcursor(self.ps.DBCONN, "_gene") as curs:
            curs.execute("""
SELECT organ, q1, q2, q3, whisker_low, whisker_high
FROM r_box_plots
WHERE gene = %(gene)s""",
                         { "gene" : gene })
            rows = curs.fetchall()
            data = []
            mmax = 0
            for r in rows:
                d = {}
                d["label"] = r[0]
                d["values"] = {}
                d["values"]["Q1"] = float(r[1])
                d["values"]["Q2"] = float(r[2])
                d["values"]["Q3"] = float(r[3])
                d["values"]["whisker_low"] = float(r[4])
                d["values"]["whisker_high"] = float(r[5])
                d["values"]["outliers"] = []
                data.append(d)
                mmax = max(mmax, r[5])

        ret = {"data" : data,
               "mmax" : mmax}
        return ret
    
