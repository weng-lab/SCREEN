export const panelize = (title, facet) => {
    return (<div className="panel-group facet">
	    <div className="panel panel-primary">
	    <div className="panel-heading">{title}</div>
	    <div className="panel-body">
            {facet}
	    </div>
	    </div>
	    </div>);
};

export const doToggle = (oldSet, item) => {
    let ret = new Set(oldSet);
    if(ret.has(item)){
        ret.delete(item);
    } else {
        ret.add(item);
    }
    return ret;
}
