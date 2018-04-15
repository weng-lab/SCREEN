def GeData(assembly, isNormalized):
    tableNameData = assembly + "_rnaseq_expression"
    if isNormalized:
        tableNameData += "_norm"
    else:
        tableNameData += "_unnorm"
    return tableNameData

def GeMetadata(assembly):
    return assembly + "_rnaseq_expression"
