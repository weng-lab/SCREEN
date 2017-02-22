import * as Para from './tab_about_paragraphs';

const TabAbout = () => {
    let content = (
        <div className="container">
            <div className="row">
                <div className="col-md-12">
                    <h3>The ENCODE Encyclopedia</h3>
                    <img src="/static/about/images/image04.png"
                         className={"img-responsive"}
                         alt={"ENCODE data levels"} />
                    {Para.intro()}
                </div>
            </div>

            <div className="row">
                <div className="col-md-12">
                    <h4>The Registry of candidate Regulatory Elements</h4>
                </div>
            </div>
            <div className="row">
                <div className="col-md-8">
                    {Para.registry1()}
                    {Para.registry2()}
                    {Para.registry3()}
                    {Para.registry4()}
                </div>
                <div className="col-md-4">
                    <img src="/static/about/images/image00.png"
                         className={"img-responsive"}
                         alt={"UCSC data tracks"} />
                    <img src="/static/about/images/image02.png"
                         className={"img-responsive"}
                         alt={"CRE flow chart"} />
                </div>
            </div>
            <div className="row">
                <div className="col-md-8">
                    <img src="/static/about/images/image06.png"
                         className={"img-responsive"}
                         alt={"pie chart"} />
                </div>
                <div className="col-md-4">
                </div>
            </div>

            <div className="row">
                <div className="col-md-12">
                    <h3>Annotating candidate Regulatory Elements</h3>
                </div>
            </div>
            <div className="row">
                <div className="col-md-8">
                    <h4>Genomic Context</h4>
                    {Para.genomicContext()}
                </div>
                <div className="col-md-4">
                    <img src="/static/about/images/image05.png"
                         className={"img-responsive"}
                         alt={"pie chart"} />
                </div>
            </div>
            <div className="row">
                <div className="col-md-8">
                    <h4>Histone Modifications and Transcription Factor Occupancy</h4>
                    {Para.occupancy1()}
                    {Para.occupancy2()}
                </div>
                <div className="col-md-4">
                    <img src="/static/about/images/image03.png"
                         className={"img-responsive"}
                         alt={"pie chart"} />
                    <img src="/static/about/images/image01.png"
                         className={"img-responsive"}
                         alt={"pie chart"} />
                </div>
            </div>
        </div>);

    return (<div>
            {content}
    </div>);
}

export default TabAbout;
