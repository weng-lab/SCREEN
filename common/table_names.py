
# SPDX-License-Identifier: MIT
# Copyright (c) 2016-2020 Michael Purcaro, Henry Pratt, Jill Moore, Zhiping Weng

def GeData(assembly, isNormalized):
    tableNameData = assembly + "_rnaseq_expression"
    if isNormalized:
        tableNameData += "_norm"
    else:
        tableNameData += "_unnorm"
    return tableNameData

def GeExperimentList(assembly):
    return assembly + "_rnaseq_experiment_list"

def GeMetadata(assembly):
    return assembly + "_rnaseq_metadata"
