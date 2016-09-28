#!/usr/bin/env python

import sys
import numpy as np
import pandas as pd

def quantileNormalize(df_input):
    # from https://github.com/ShawnLYU/Quantile_Normalize
    df = df_input.copy()
    print("df", df)
    
    #compute rank
    dic = {}
    for col in df:
        dic[col] = sorted(df[col])
    sorted_df = pd.DataFrame(dic)
    print("sorted_df", sorted_df)

    rank = sorted_df.mean(axis = 1).tolist()
    print("rank", rank)
    
    #sort
    for col in df:
        t = np.searchsorted(np.sort(df[col]), df[col])
        df[col] = [rank[i] for i in t]
    return df

def main():
    data = {"a1" : [5,2,0,3,4],
            "a2" : [4,1,0,4,2],
            "a3" : [3,4,7,6,8]}
    df = pd.DataFrame(data, columns=['a1', 'a2', 'a3'])
    print(quantileNormalize(df))

if __name__ == "__main__":
    sys.exit(main())
