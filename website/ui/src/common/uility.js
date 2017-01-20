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
