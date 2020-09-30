/*
 * SPDX-License-Identifier: MIT
 * Copyright (c) 2016-2020 Michael Purcaro, Henry Pratt, Jill Moore, Zhiping Weng
 */

import React from 'react';

const loading = ({isFetching, message}) => {
    if (!message) {
        message = "";
    }
    return (
        <div className={"loading"}
             style={{"display": (isFetching ? "block" : "none")}}>
            Loading... {message}
            <i className="fa fa-refresh fa-spin" style={{fontSize: "24px"}} />
        </div>);
}

export default loading;

