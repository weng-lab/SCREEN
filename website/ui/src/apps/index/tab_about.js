import * as Para from './tab_about_paragraphs';

const TabAbout = () => {
    let content = (
        <div className="container">
            <div className="row">
                <div className="col-md-12">
                    <h2>The ENCODE Encyclopedia</h2>
                    <img src="/static/about/images/image04.png"
                         className={"img-responsive mainLogo"}
                         alt={"ENCODE data levels"} />
                    {Para.intro()}
                </div>
            </div>

            <div className="row">
                <div className="col-md-12">
                    <h3>The Registry of candidate Regulatory Elements</h3>
                </div>
            </div>
            <div className="row">
                <div className="col-md-8">
                    {Para.registry1()}
                </div>
                <div className="col-md-4">
                    <img src="/static/about/images/image00.png"
                         className={"img-responsive mainLogo"}
                         alt={"UCSC data tracks"} />
                </div>
            </div>
            <div className="row">
                <div className="col-md-8">
                    {Para.registry2()}
                </div>
                <div className="col-md-4">
                </div>
            </div>
        </div>);

    return (<div>
	    <h2>About</h2>
            {content}
    </div>);
}

export default TabAbout;
