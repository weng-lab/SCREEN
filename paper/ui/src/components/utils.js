import React from 'react';

export const figure = (num, alt, style = {}) => {
    return (
        <div className={"panel panel-default"}>
            <div className="panel-body">
                <figure className={"figure"}>
	            <img src={"/static/encyc/images/Slide" + num + ".JPG"}
                         className={"figure-img img-fluid rounded img-responsive"}
                         alt={alt}
	                 style={style}
                    />
                    <figcaption className={"figure-caption"}>
                        <b>Figure {num}</b>
                    </figcaption>
                </figure>
            </div>
        </div>);
}
