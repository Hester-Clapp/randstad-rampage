
function bigKey({latitude, longitude}) {
    return `${Math.floor(latitude * 100)}${Math.floor(longitude * 100)}`;
}

function smallKey({latitude, longitude}) {
    return `${Math.floor(latitude * 1000)}${Math.floor(longitude * 1000)}`;
}

export {bigKey, smallKey}