# Searching cCREs

## Query cCREs by location

Returns the cCREs in the given range, their location, and their zscores in K562.

```graphql
query {
  ccres(
    assembly: GRCh38
    range: { chrom: "chr2", start: 115500000, end: 116000000 }
  ) {
    total
    ccres {
      accession
      range {
        chrom
        start
        end
      }
      ctspecific(ct: "K562") {
        dnase_zscore
        h3k4me3_zscore
        h3k27ac_zscore
        ctcf_zscore
      }
    }
  }
}
```

## Query cCREs by max epigenetic signal

Searches for cCREs on chromosome 2, with max H3K4me3 zscore between 2 and 3.

```graphql
query {
  ccres(
    assembly: GRCh38
    range: { chrom: "chr2" }
    expmaxs: { rank_promoter_start: 2, rank_promoter_end: 3 }
  ) {
    total
    ccres {
      accession
      k4me3max
    }
  }
}
```

## Query cCREs by biosample-specific epigenetic signal

Returns cCREs on chromosome 2 active in K562 (dnase zscore >= 1.64).

```graphql
query {
  ccres(
    assembly: GRCh38
    range: { chrom: "chr2" }
    ctexps: { cellType: "K562", rank_dnase_start: 1.64 }
  ) {
    total
    ccres {
      accession
      k4me3max
    }
  }
}
```

## Query cCREs by accession

Returns back two cCREs by accession.

```graphql
query {
  ccres(assembly: GRCh38, accessions: ["EH38E2000616", "EH38E1972623"]) {
    ccres {
      accession
    }
  }
}
```


# Try it out

What query would you use to find the nearby protein-coding genes of enhancer-like GRCh38 cCREs in GM12878 on chromosome 16?

<details>
<summary>See answer</summary>

```graphql
query {
  ccres(
    assembly: GRCh38
    range: { chrom: "chr16" }
    ctexps: { cellType: "GM12878", rank_dnase_start: 1.64, rank_enhancer_start: 1.64 }
  ) {
    total
    ccres {
      accession
      nearbygenes {
        pc {
          distance
          gene {
            approved_symbol
          }
        }
      }
    }
  }
}
```
</details>

<br />