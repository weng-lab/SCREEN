import React from 'react';

export const tabPanelize = (content) => {
    return (
        <div>
            <div className={"panel panel-default"}>
                <div className={"panel-body"}>
                    <div className={"container-fluid"}>
	                {content}
	            </div>
	        </div>
	    </div>
        </div>);
}

export const doToggle = (oldSet, item) => {
    let ret = new Set(oldSet);
    if(ret.has(item)){
        ret.delete(item);
    } else {
        ret.add(item);
    }
    return ret;
}
