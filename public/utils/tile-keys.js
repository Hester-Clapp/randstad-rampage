
function bigKey({latitude, longitude}) {
    return `${Math.floor(latitude * 100)}${Math.floor(longitude * 100)}`;
}

function mediumKey({latitude, longitude}) {
    return `${Math.floor(latitude * 200) * 5}${Math.floor(longitude * 200) * 5}`;
}

function smallKey({latitude, longitude}) {
    return `${Math.floor(latitude * 1000)}${Math.floor(longitude * 1000)}`;
}

export {bigKey, mediumKey, smallKey}