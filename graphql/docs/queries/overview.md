The SCREEN API facilitates access to a number of different data and types of
data. Here, we'll briefly describe the data available, but go into more depth,
with examples, for each in separate pages.

> Remember: a complete list of types, fields, and documentation is available in
> the GraphQL playground.

## Retrieving metadata

In many queries, specific names for biosamples, cell compartments, transcription
factors, etc. are required/optional for input. So, it's important to be able to
get a list of these. The `globals` field allows querying metadata.

## Searching for cCREs

In order to search for ccREs, you can use the `ccres` field. cCREs can be
searched by a set of accession, a range, or by their epigenetic signals. This is
useful to find basic information about a lot of cCREs, such as their location,
their biosample-agnostic epigenetic signals, or their epigenetic signals in a
single or few cell types. However, due to performance limitations, it is not a
good choice to get detailed information (such as epigenetics signals in every
cell type). For this reason, this data is unavailable when querying more than 5
cCREs at a time. If you do want this data for individual cCREs, see the next
section.

## Getting details for a single cCRE

To get detailed information on a single cCRE, such as their epigenetic signals
in all cell types, or their intersection with transcription factors, you can use
the `ccre` field.

## Querying gene expression data

The SCREEN API has imported all ENCODE RNA-seq data. With the `geneExpression`
field, you can query the expression of a single gene across all biosamples.

## Querying differential gene expression data

**NOTE: Differential expression data is only available for mm10 currently**

For mouse embryonic biosamples, differential gene expression data is available
with the `differentialExpression` field.

## Querying GWAS and SNP data

**NOTE: GWAS data is only available for GRCh38**

In order to query GWAS studies, their defined LD Blocks, and their SNPs, you can
use the `gwas` field. You can also query SNPs by genome, accession, or location
with the `snps` field.

## Query RAMPAGE data

You can query RAMPAGE data for a particular gene with the `rampage` field.

## Find genomic elements in a given range

If you have a given range in the genome and want to find intersecting elements,
you can use the `range` field.