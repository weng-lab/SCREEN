library("pasilla")
library("DESeq")

# get input TSV, metadata paths
args <- commandArgs(trailingOnly = TRUE)
dir <- args[1]
tsv <- paste(dir, "data.tsv", sep="/")
metadata <- paste(dir, "metadata.tsv", sep="/")

# read data, metadata
pasillaCountTable = read.table(tsv, header=TRUE, row.names=1)
metadata = read.table(metadata, header=TRUE, row.names=1, sep="\t")

# frame data for input to DESeq
pasillaDesign = data.frame(row.names = colnames(pasillaCountTable),
	                   condition = c("treated", "untreated", "treated", "untreated"), #metadata$condition,
			   libType = c("single-end", "paired-end", "single-end", "paired-end")) #metadata$libType )

# input to DESeq, estimate size and dispersions
cds = newCountDataSet(pasillaCountTable, metadata$condition)
cds = estimateSizeFactors(cds)
cds = estimateDispersions(cds)

# save plot of dispersions
png(paste(dir, "dispersions.png", sep="/"))
plotDispEsts(cds)
dev.off()

# perform a single regression against cell type only
conditions = levels(metadata$condition)
cat("running nbiomTest")
res = nbinomTest(cds, conditions[1], conditions[2])
   
# plot fold change vs normalized counts
png(paste(dir, "fc.png", sep="/"))
plotMA(res)
dev.off()

# get list of differentially expressed genes
resSig = res[ res$padj < 0.1, ]
head(resSig[ order(resSig$pval), ])

head(resSig)
write.table(resSig, file=paste(dir, "genelist.tsv"))
