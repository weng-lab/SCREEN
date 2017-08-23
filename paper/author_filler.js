let authors = [];

let keys = {
    firstName: "contrib_auth_4_first_nm",
    middleName: "contrib_auth_4_middle_nm",
    lastName: "contrib_auth_4_last_nm",
    email: "contrib_auth_4_email",
    org: "contrib_auth_4_org",
    country: "contrib_auth_4_country"
};

for(let i = 4; i < 476; i++){
    let a = authors[i];
    for (let k in keys){
	let d = keys[k].replace('_4_', '_' + i.toString() + '_');
	let x = document.getElementById(d)
	x.value = a[k];
    }
}
