class TrackhubColor:
    def __init__(self, rgbc, hexc):
        self.rgb = rgbc
        self.hex = hexc

class PredictionTrackhubColors:
    distal_regions = TrackhubColor("255,205,0", "#FFCD00")
    distal_light_boundary = TrackhubColor("255,235,200", "#FFEBC8")
    proximal_regions = TrackhubColor("255,0,0", "#FF0000")
    proximal_light_boundary = TrackhubColor("255,200,200", "#FFC8C8")

class EncodeTrackhubColors:
    H3K27ac_Signal = TrackhubColor("18,98,235", "#1262EB")
    DNase_Signal = TrackhubColor("6,218,147", "#06DA93")
    H3K4me3_Signal = TrackhubColor("255,0,0", "#FF0000")
    RNAseq_Signal = TrackhubColor("0,170,0", "#00aa00")
    RAMPAGE_peaks = TrackhubColor("214,66,202", "#D642CA")
    RAMPAGE_signal = TrackhubColor("214,66,202", "#D642CA")

class OtherTrackhubColors:
    Conservation = TrackhubColor("153,153,153", "#999999")
    Genes = TrackhubColor("0,0,0", "#000000")

def GetTrackColorSignal(exp):
    if "RNA-seq" in exp.assay_term_name:
        return EncodeTrackhubColors.RNAseq_Signal
    m = {"ChIP-seq" : None,
         "H3K27ac" : EncodeTrackhubColors.H3K27ac_Signal,
         "DNase-seq" : EncodeTrackhubColors.DNase_Signal,
         "H3K4me3" : EncodeTrackhubColors.H3K4me3_Signal,
         "RAMPAGE" : EncodeTrackhubColors.RAMPAGE_signal}
    if exp.assay_term_name in m:
        return m[exp.assay_term_name]
    return None
