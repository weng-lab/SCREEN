### R code from vignette source 'DESeq.Rnw'

###################################################
### code chunk number 1: options
###################################################
options(digits=3, width=100)


###################################################
### code chunk number 2: systemFile
###################################################
datafile = system.file( "extdata/pasilla_gene_counts.tsv", package="pasilla" )
datafile


###################################################
### code chunk number 3: readTable
###################################################
pasillaCountTable = read.table( datafile, header=TRUE, row.names=1 )
head( pasillaCountTable )


###################################################
### code chunk number 4: pasillaDesign
###################################################
pasillaDesign = data.frame(
   row.names = colnames( pasillaCountTable ),
   condition = c( "untreated", "untreated", "untreated",
      "untreated", "treated", "treated", "treated" ),
   libType = c( "single-end", "single-end", "paired-end",
      "paired-end", "single-end", "paired-end", "paired-end" ) )

pasillaDesign


###################################################
### code chunk number 5: pairedSamples
###################################################
pairedSamples = pasillaDesign$libType == "paired-end"
countTable = pasillaCountTable[ , pairedSamples ]
condition = pasillaDesign$condition[ pairedSamples ]


###################################################
### code chunk number 6: DESeq.Rnw:163-165
###################################################
head(countTable)
condition


###################################################
### code chunk number 7: condition (eval = FALSE)
###################################################
## #not run
## condition = factor( c( "untreated", "untreated", "treated", "treated" ) )


###################################################
### code chunk number 8: conditionCheck
###################################################
stopifnot( identical( condition, factor( c( "untreated", "untreated", "treated", "treated" ) ) ) )


###################################################
### code chunk number 9: instantiate
###################################################
library( "DESeq" )
head(countTable)
condition
quit()
cds = newCountDataSet( countTable, condition )


###################################################
### code chunk number 10: estimateSizeFactors
###################################################
cds = estimateSizeFactors( cds )
sizeFactors( cds )


###################################################
### code chunk number 11: headcounts2
###################################################
head( counts( cds, normalized=TRUE ) )


###################################################
### code chunk number 12: estimateDispersions
###################################################
cds = estimateDispersions( cds )


###################################################
### code chunk number 13: str
###################################################
str( fitInfo(cds) )


###################################################
### code chunk number 14: figFit
###################################################
plotDispEsts( cds )


###################################################
### code chunk number 15: DESeq.Rnw:309-310
###################################################
all(table(conditions(cds))==2)


###################################################
### code chunk number 16: head
###################################################
head( fData(cds) )


###################################################
### code chunk number 17: nbt1
###################################################
res = nbinomTest( cds, "untreated", "treated" )


###################################################
### code chunk number 18: nbt2
###################################################
head(res)


###################################################
### code chunk number 19: checkClaims
###################################################
stopifnot(identical(colnames(res), c("id", "baseMean", "baseMeanA", "baseMeanB", "foldChange",
                                     "log2FoldChange", "pval", "padj")))


###################################################
### code chunk number 20: figDE
###################################################
plotMA(res)


###################################################
### code chunk number 21: histp
###################################################
hist(res$pval, breaks=100, col="skyblue", border="slateblue", main="")


###################################################
### code chunk number 22: ressig1
###################################################
resSig = res[ res$padj < 0.1, ]


###################################################
### code chunk number 23: ressig2
###################################################
head( resSig[ order(resSig$pval), ] )


###################################################
### code chunk number 24: ressig3
###################################################
head( resSig[ order( resSig$foldChange, -resSig$baseMean ), ] )


###################################################
### code chunk number 25: ressig4
###################################################
head( resSig[ order( -resSig$foldChange, -resSig$baseMean ), ] )


###################################################
### code chunk number 26: writetable
###################################################
write.csv( res, file="My Pasilla Analysis Result Table.csv" )


###################################################
### code chunk number 27: ncu
###################################################
ncu = counts( cds, normalized=TRUE )[ , conditions(cds)=="untreated" ]


###################################################
### code chunk number 28: MArepl
###################################################
plotMA(data.frame(baseMean = rowMeans(ncu),
                  log2FoldChange = log2( ncu[,2] / ncu[,1] )),
       col = "black")


###################################################
### code chunk number 29: subset
###################################################
cdsUUT = cds[ , 1:3]
pData( cdsUUT )


###################################################
### code chunk number 30: est123
###################################################
cdsUUT = estimateSizeFactors( cdsUUT )
cdsUUT = estimateDispersions( cdsUUT )
resUUT = nbinomTest( cdsUUT, "untreated", "treated" )


###################################################
### code chunk number 31: figDE_Tb
###################################################
plotMA(resUUT)


###################################################
### code chunk number 32: subset2
###################################################
cds2 = cds[ ,c(  "untreated3", "treated3"   ) ]


###################################################
### code chunk number 33: cds2
###################################################
cds2 = estimateDispersions( cds2, method="blind", sharingMode="fit-only" )


###################################################
### code chunk number 34: res2
###################################################
res2 = nbinomTest( cds2, "untreated", "treated" )


###################################################
### code chunk number 35: figDE2
###################################################
plotMA(res2)


###################################################
### code chunk number 36: addmarg
###################################################
addmargins( table( res_sig = res$padj < .1, res2_sig = res2$padj < .1 ) )


###################################################
### code chunk number 37: reminderFullData
###################################################
head( pasillaCountTable )
pasillaDesign


###################################################
### code chunk number 38: fct
###################################################
cdsFull = newCountDataSet( pasillaCountTable, pasillaDesign )


###################################################
### code chunk number 39: estsfdisp
###################################################
cdsFull = estimateSizeFactors( cdsFull )
cdsFull = estimateDispersions( cdsFull )


###################################################
### code chunk number 40: figFitPooled
###################################################
plotDispEsts( cdsFull )


###################################################
### code chunk number 41: fit1
###################################################
fit1 = fitNbinomGLMs( cdsFull, count ~ libType + condition )
fit0 = fitNbinomGLMs( cdsFull, count ~ libType  )


###################################################
### code chunk number 42: fitstr
###################################################
str(fit1)


###################################################
### code chunk number 43: pvalsGLM
###################################################
pvalsGLM = nbinomGLMTest( fit1, fit0 )
padjGLM = p.adjust( pvalsGLM, method="BH" )


###################################################
### code chunk number 44: addmarg2
###################################################
tab1 = table( "paired-end only" = res$padj < .1, "all samples" = padjGLM < .1 )
addmargins( tab1 )


###################################################
### code chunk number 45: tablesignfitInfocdsperGeneDispEsts
###################################################
table(sign(fitInfo(cds)$perGeneDispEsts - fitInfo(cdsFull)$perGeneDispEsts))


###################################################
### code chunk number 46: figDispScatter
###################################################
trsf = function(x) log( (x + sqrt(x*x+1))/2 )
plot( trsf(fitInfo(cds)$perGeneDispEsts),
      trsf(fitInfo(cdsFull)$perGeneDispEsts), pch=16, cex=0.45, asp=1)
abline(a=0, b=1, col="red3")


###################################################
### code chunk number 47: lookatfit1
###################################################
head(fit1)


###################################################
### code chunk number 48: fullAnalysisSimple
###################################################
cdsFullB = newCountDataSet( pasillaCountTable, pasillaDesign$condition )
cdsFullB = estimateSizeFactors( cdsFullB )
cdsFullB = estimateDispersions( cdsFullB )
resFullB = nbinomTest( cdsFullB, "untreated", "treated" )


###################################################
### code chunk number 49: table
###################################################
tab2 = table(
   `all samples simple` = resFullB$padj < 0.1,
   `all samples GLM`    = padjGLM < 0.1 )
addmargins(tab2)


###################################################
### code chunk number 50: rs
###################################################
rs = rowSums ( counts ( cdsFull ))
theta = 0.4
use = (rs > quantile(rs, probs=theta))
table(use)
cdsFilt = cdsFull[ use, ]


###################################################
### code chunk number 51: check
###################################################
stopifnot(!any(is.na(use)))


###################################################
### code chunk number 52: fitFilt
###################################################
fitFilt1  = fitNbinomGLMs( cdsFilt, count ~ libType + condition )
fitFilt0  = fitNbinomGLMs( cdsFilt, count ~ libType  )
pvalsFilt = nbinomGLMTest( fitFilt1, fitFilt0 )
padjFilt  = p.adjust(pvalsFilt, method="BH" )


###################################################
### code chunk number 53: doublecheck
###################################################
stopifnot(all.equal(pvalsFilt, pvalsGLM[use]))


###################################################
### code chunk number 54: tab
###################################################
padjFiltForComparison = rep(+Inf, length(padjGLM))
padjFiltForComparison[use] = padjFilt
tab3 = table( `no filtering`   = padjGLM < .1,
             `with filtering` = padjFiltForComparison < .1 )
addmargins(tab3)


###################################################
### code chunk number 55: figscatterindepfilt
###################################################
plot(rank(rs)/length(rs), -log10(pvalsGLM), pch=16, cex=0.45)


###################################################
### code chunk number 56: histindepfilt
###################################################
h1 = hist(pvalsGLM[!use], breaks=50, plot=FALSE)
h2 = hist(pvalsGLM[use], breaks=50, plot=FALSE)
colori = c(`do not pass`="khaki", `pass`="powderblue")


###################################################
### code chunk number 57: fighistindepfilt
###################################################
barplot(height = rbind(h1$counts, h2$counts), beside = FALSE, col = colori,
        space = 0, main = "", ylab="frequency")
text(x = c(0, length(h1$counts)), y = 0, label = paste(c(0,1)), adj = c(0.5,1.7), xpd=NA)
legend("topright", fill=rev(colori), legend=rev(names(colori)))


###################################################
### code chunk number 58: sortP
###################################################
orderInPlot = order(pvalsFilt)
showInPlot = (pvalsFilt[orderInPlot] <= 0.08)
alpha = 0.1


###################################################
### code chunk number 59: sortedP
###################################################
plot(seq(along=which(showInPlot)), pvalsFilt[orderInPlot][showInPlot],
     pch=".", xlab = expression(rank(p[i])), ylab=expression(p[i]))
abline(a=0, b=alpha/length(pvalsFilt), col="red3", lwd=2)


###################################################
### code chunk number 60: doBH
###################################################
whichBH = which(pvalsFilt[orderInPlot] <= alpha*seq(0, 1, length=length(pvalsFilt)))
## Test some assertions:
## - whichBH is a contiguous set of integers from 1 to length(whichBH)
## - the genes selected by this graphical method coincide with those
##   from p.adjust (i.e. padjFilt)
stopifnot(length(whichBH)>0,
          identical(whichBH, seq(along=whichBH)),
          padjFilt[orderInPlot][ whichBH] <= alpha,
          padjFilt[orderInPlot][-whichBH]  > alpha)


###################################################
### code chunk number 61: SchwSpjot
###################################################
j  = round(length(pvalsFilt)*c(1, .66))
px = (1-pvalsFilt[orderInPlot[j]])
py = ((length(pvalsFilt)-1):0)[j]
slope = diff(py)/diff(px)


###################################################
### code chunk number 62: SchwederSpjotvoll
###################################################
plot(1-pvalsFilt[orderInPlot],
     (length(pvalsFilt)-1):0, pch=".",
     xlab=expression(1-p[i]), ylab=expression(N(p[i])))
abline(a=0, b=slope, col="red3", lwd=2)


###################################################
### code chunk number 63: defvsd
###################################################
cdsBlind = estimateDispersions( cds, method="blind" )
vsd = varianceStabilizingTransformation( cdsBlind )


###################################################
### code chunk number 64: vsd1
###################################################
##par(mai=ifelse(1:4 <= 2, par("mai"), 0))
px     = counts(cds)[,1] / sizeFactors(cds)[1]
ord    = order(px)
ord    = ord[px[ord] < 150]
ord    = ord[seq(1, length(ord), length=50)]
last   = ord[length(ord)]
vstcol = c("blue", "black")
matplot(px[ord],
        cbind(exprs(vsd)[, 1], log2(px))[ord, ],
        type="l", lty=1, col=vstcol, xlab="n", ylab="f(n)")
legend("bottomright",
       legend = c(
        expression("variance stabilizing transformation"),
        expression(log[2](n/s[1]))),
       fill=vstcol)


###################################################
### code chunk number 65: vsd2
###################################################
library("vsn")
par(mfrow=c(1,2))
notAllZero = (rowSums(counts(cds))>0)
meanSdPlot(log2(counts(cds)[notAllZero, ] + 1))
meanSdPlot(vsd[notAllZero, ])


###################################################
### code chunk number 66: modlr
###################################################
mod_lfc = (rowMeans( exprs(vsd)[, conditions(cds)=="treated", drop=FALSE] ) -
           rowMeans( exprs(vsd)[, conditions(cds)=="untreated", drop=FALSE] ))


###################################################
### code chunk number 67: dah
###################################################
lfc = res$log2FoldChange
table(lfc[!is.finite(lfc)], useNA="always")


###################################################
### code chunk number 68: colourramp
###################################################
logdecade = 1 + round( log10( 1+rowMeans(counts(cdsBlind, normalized=TRUE)) ) )
lfccol = colorRampPalette( c( "gray", "blue" ) )(6)[logdecade]


###################################################
### code chunk number 69: figmodlr
###################################################
ymax = 4.5
plot( pmax(-ymax, pmin(ymax, lfc)), mod_lfc,
      xlab = "ordinary log-ratio", ylab = "moderated log-ratio",
      cex=0.45, asp=1, col = lfccol,
      pch = ifelse(lfc<(-ymax), 60, ifelse(lfc>ymax, 62, 16)))
abline( a=0, b=1, col="red3")


###################################################
### code chunk number 70: cdsFullBlind
###################################################
cdsFullBlind = estimateDispersions( cdsFull, method = "blind" )
vsdFull = varianceStabilizingTransformation( cdsFullBlind )


###################################################
### code chunk number 71: heatmap
###################################################
library("RColorBrewer")
library("gplots")
select = order(rowMeans(counts(cdsFull)), decreasing=TRUE)[1:30]
hmcol = colorRampPalette(brewer.pal(9, "GnBu"))(100)


###################################################
### code chunk number 72: figHeatmap2a
###################################################
heatmap.2(exprs(vsdFull)[select,], col = hmcol, trace="none", margin=c(10, 6))


###################################################
### code chunk number 73: figHeatmap2b
###################################################
heatmap.2(counts(cdsFull)[select,], col = hmcol, trace="none", margin=c(10,6))


###################################################
### code chunk number 74: sampleClust
###################################################
dists = dist( t( exprs(vsdFull) ) )


###################################################
### code chunk number 75: figHeatmapSamples
###################################################
mat = as.matrix( dists )
rownames(mat) = colnames(mat) = with(pData(cdsFullBlind), paste(condition, libType, sep=" : "))
heatmap.2(mat, trace="none", col = rev(hmcol), margin=c(13, 13))


###################################################
### code chunk number 76: figPCA
###################################################
print(plotPCA(vsdFull, intgroup=c("condition", "libType")))


###################################################
### code chunk number 77: sessi
###################################################
sessionInfo()

