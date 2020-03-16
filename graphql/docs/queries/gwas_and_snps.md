# Get GWAS and SNP data

## Get GWAS studies

Returns all studies in GRCh38.

```graphql
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

Returns data for a specific study.

```graphql
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

Returns data for a specific SNP.

```graphql
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

Returns SNPS in a given range.

```graphql
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

# Try it out

What query would you use to get the ldblocks that contain the GRCh38 SNP `rs10186843`, including the following: 
- The SNP id
- The r<sup>2</sup> value for the SNP in the ldblock
- The name of the ldblock
- This name of the study that identifies the ldblock
- The id of the leadsnp of the ldblock

<details>
<summary>See answer</summary>

```graphql
query {
  snps(assembly: GRCh38, id: "rs10186843") {
    assembly
    id
    ldblocks {
      snp {
        id
      }
      r2
      ldblock {
        name
        study {
          name
        }
        leadsnp {
          id
        }
      }
    }
  }
}
```
</details>

<br />
