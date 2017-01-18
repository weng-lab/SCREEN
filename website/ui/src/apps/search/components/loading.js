const loading = ({isFetching}) => {
    return (<div className={"loading"}
            style={{"display": (isFetching ? "block" : "none")}}>
	    Loading...
	    </div>);
}

export default loading;
