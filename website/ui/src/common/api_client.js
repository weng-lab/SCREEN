export const StaticServer = "http://screen.encodeproject.org/assets";
export const StaticUrl = (fn) => (StaticServer + fn)
export const ApiServer = "http://screen.encodeproject.org/api"; // "/api/"

export const Servers = (b) => {
  /*  let override = {"/gbws/geneTrack" : "http://localhost:9006/gbws/geneTrack",
		    "/gbws/trackhub" : "http://localhost:9006/gbws/trackhub"};
    if(b in override){
	return override[b];
}*/
    return ApiServer + b;
};

export const getByPost  = (jq, url, successF, errF) => {
    fetch(Servers(url),
	  {
	      headers: {
		  'Accept': 'application/json',
		  'Content-Type': 'application/json'
	      },
	      method: "POST",
	      body: jq
	  })
	.then((response) => (response.json()))
	.then(successF)
	.catch(errF);
}

export const getMinipeaks = (jq, successF, errF) => {
    const url = "http://screen.encodeproject.org/api/dataws/re_detail/similarREs";
    fetch(url,
	  {
	      headers: {
		  'Accept': 'application/json',
		  'Content-Type': 'application/json'
	      },
	      method: "POST",
	      body: jq
	  })
	.then((response) => (response.json()))
	.then(successF)
	.catch(errF);
}

export const getIntersect = (jq, successF, errF) => {
    const url = "http://api.wenglab.org/postws/lines";
    fetch(url,
	  {
	      headers: {
		  'Accept': 'application/json',
		  'Content-Type': 'application/json'
	      },
	      method: "POST",
	      body: jq
	  })
	.then((response) => (response.json()))
	.then(successF)
	.catch(errF);
}

export const setByPost  = (jq, url, successF, errF) => {
    fetch(Servers(url),
	  {
	      headers: {
		  'Accept': 'application/json',
		  'Content-Type': 'application/json'
	      },
	      method: "POST",
	      body: jq
	  })
	.then((response) => (response.json()))
	.then(successF)
	.catch(errF);
}

export const autocompleteBox = (jq, successF, errF) => {
    getByPost(jq, "/autows/search", successF, errF);
}

export const autocompleteBoxSuggestions = (jq, successF, errF) => {
    getByPost(jq, "/autows/suggestions", successF, errF);
}

export const appPageBaseInit = (jq, url, successF, errF) => {
    getByPost(jq, url, successF, errF);
}

export const globals = (assembly, successF, errF) => {
    fetch(Servers("/globalData/0/") + assembly)
	.then((response) => (response.json()))
	.then(successF)
	.catch(errF);
}

export const globalTabFiles = (successF, errF) => {
    fetch(Servers("/globalData/index/index"))
	.then((response) => (response.json()))
	.then(successF)
	.catch(errF);
}
