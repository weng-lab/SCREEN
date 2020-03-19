/* -*- mode: javascript; c-basic-offset: 4; indent-tabs-mode: nil -*- */

// 
// Dalliance Genome Explorer
// (c) Thomas Down 2006-2010
//
// das.js: queries and low-level data model.
//


//
// DAS 1.6 features command
//

export function DASFeature() {
}

export function DASGroup(id) {
    if (id)
        this.id = id;
}
