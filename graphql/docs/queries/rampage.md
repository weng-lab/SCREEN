
## Get RAMPAGE data for a given gene

```
query {
  rampage(assembly: GRCh38, gene: "TIGAR") {
    transcripts {
      transcript
      range {
        chrom
        start
        end
      }
      geneinfo
      items {
        expid
        biosample_term_name
        tissue
        strand
        counts
      }
    }
  }
}
```