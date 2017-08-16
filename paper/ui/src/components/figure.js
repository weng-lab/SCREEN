let React = require('react');

export const Figure = ({ number, title, style = {} }) => (
    <div className="row">
        <div className="col-md-6">
            <h3>{title}</h3>
            <div className={"panel panel-default"}>
                <div className="panel-body">
                    <figure className={"figure"}>
	                <img src={"/static/encyc/images/Slide" + number + ".JPG"}
                          className={"figure-img img-fluid rounded img-responsive"}
                          alt={"Figure " + number} style={style} />
                        <figcaption className={"figure-caption"}>
                            <b>Figure {number}</b>
                        </figcaption>
                    </figure>
                </div>
            </div>
        </div>
    </div>
);
export default Figure;
