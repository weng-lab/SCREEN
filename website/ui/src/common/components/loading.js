const loading = ({isFetching, message}) => {
    if (!message) {
        message = "";
    }
    return (<div className={"loading"}
            style={{"display": (isFetching ? "block" : "none")}}>
	    Loading... {message}
	    </div>);
}

export default loading;

