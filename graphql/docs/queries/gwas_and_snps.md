# Get GWAS and SNP data

## Get GWAS studies

```
query {
  gwas(assembly: GRCh38) {
    studies {
      name
      author
      pubmed
      trait
    }
  }
}
```

## Get data for a single GWAS study

```
query {
  gwas(assembly: GRCh38) {
    study(study: "Li_M_28588231_1,5_anhydroglucitol_levels") {
      totalLDblocks
      numLdBlocksOverlap
      numcCREsOverlap
      allSNPs {
        snp {
          id
        }
        r2
        ldblock {
          leadsnp {
            id
          }
        }
      }
      topCellTypes {
        ct {
          name
        }
        biosample_summary
        expID
        fdr
        pval
      }
      ccres {
        cCRE {
          accession
        }
        geneid
        snps
      }
    }
  }
}
```

## Search for a SNP by id

```
query {
  snps(assembly: GRCh38, id: "rs367896724") {
    id
    range {
      chrom
      start
      end
    }
  }
}
```

## Search for a SNP by location

```
query {
  snps(assembly: GRCh38, range: { chrom: "chr1", start: 10000, end: 12000 }) {
    id
    range {
      chrom
      start
      end
    }
  }
}
```
