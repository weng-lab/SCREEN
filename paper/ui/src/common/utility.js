import React from 'react';

export const doToggle = (oldSet, item) => {
    let ret = new Set(oldSet);
    if(ret.has(item)){
        ret.delete(item);
    } else {
        ret.add(item);
    }
    return ret;
}
