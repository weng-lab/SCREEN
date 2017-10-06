export const getBigWigData = (url, successF) => {
    makeBwg(new URLFetchable(url), function(bwg, err)
        {
            if(bwg)
                {
                    let data,zoomFactor=-1;
                    if (zoomFactor< 0)
			data = bwg.getUnzoomedView();
                    else
			data = bwg.getZoomedView();
                    data.readWigData(chrom, start, end, function(data, err)
			{
                            if(data)
				{
				    this.setState({
					bbdata: Object.assign(
					    {},
					    this.state.bbdata,
					    successF(data);
					)})
				}
                            else
				console.log("error!", err);

			}
                }
            else
                console.log("error!", err);

        }
}
