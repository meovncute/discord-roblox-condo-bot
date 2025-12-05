// code by oppovietnam

import fetch from 'node-fetch';

// =========================
// AUTO RETRY FUNCTION
// =========================
async function retryUntilSuccess(fn, desc = "Request") {
    while (true) {
        try {
            let res = await fn();
            if (res && res.status === 200) {
                console.log(`${desc} success`);
                return res;
            } else {
                console.log(`${desc} failed with status ${res.status}, retrying...`);
            }
        } catch (e) {
            console.log(`${desc} error: ${e}, retrying...`);
        }
        await new Promise(r => setTimeout(r, 1500));
    }
}

// =========================
// BASIC TOKEN GRABS
// =========================
async function getXCSRF(cookie) {
    let LogoutInformation = await fetch("https://auth.roblox.com/v2/logout", {
        method: "POST",
        headers: { "Cookie": `.ROBLOSECURITY=${cookie}` }
    });
    return LogoutInformation.headers.get("x-csrf-token");
}

async function getUniverses(cookie) {
    let Universes = await fetch(
        `https://develop.roblox.com/v1/search/universes?q=creator:User&limit=50&sort=-GameCreated`,
        {
            headers: {
                Cookie: `.ROBLOSECURITY=${cookie}`,
                Referer: "https://www.roblox.com/",
                "User-Agent":
                    "Mozilla/5.0 (Windows NT 6.1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/92.0.4515.131 Safari/537.36 OPR/78.0.4093.186"
            }
        }
    );

    return await Universes.json();
}

async function getStarterUniverse(cookie) {
    let UserUniverses = await getUniverses(cookie);
    if (!UserUniverses["data"] || UserUniverses["data"].length == 0)
        return { error: "true" };

    return UserUniverses.data[0].id;
}

async function getStarterPlace(cookie) {
    let FirstUniverse = await getStarterUniverse(cookie);
    if (FirstUniverse["error"]) return { error: "true" };

    let LinkedPlaces = await fetch(
        `https://games.roblox.com/v1/games?universeIds=${FirstUniverse}`,
        {
            headers: {
                Referer: "https://www.roblox.com/",
                "User-Agent":
                    "Mozilla/5.0 (Windows NT 6.1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/92.0.4515.131 Safari/537.36 OPR/78.0.4093.186"
            }
        }
    );
    LinkedPlaces = await LinkedPlaces.json();

    if (!LinkedPlaces["data"]) return { error: "true" };

    return LinkedPlaces.data[0].rootPlaceId;
}

// =========================
// UPDATE PLACE
// =========================
async function updatePlace(cookie, content) {
    let XCSRFTOKEN = await getXCSRF(cookie);
    let placeId = await getStarterPlace(cookie);

    return retryUntilSuccess(async () => {
        return await fetch(
            `http://data.roblox.com/Data/Upload.ashx?assetid=${placeId}&type=Place`,
            {
                method: "POST",
                headers: {
                    "User-Agent": "Roblox/WinInet",
                    "x-csrf-token": XCSRFTOKEN,
                    "Content-Type": "application/xml",
                    Cookie: `.ROBLOSECURITY=${cookie}`
                },
                body: content
            }
        );
    }, "updatePlace");
}

// =========================
// RANDOM STRINGS
// =========================
function randomString2(length) {
    var result = "";
    var characters = "_SwrRo.rMn4Iof-01234567";
    for (var i = 0; i < length; i++)
        result += characters.charAt(Math.floor(Math.random() * characters.length));
    return result;
}

function randomString(length) {
    var result = "";
    var characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    for (var i = 0; i < length; i++)
        result += characters.charAt(Math.floor(Math.random() * characters.length));
    return result;
}

// =========================
// PUBLIC / PRIVATE
// =========================
async function setPublicUniverse(universeId, cookie, xcsrf, active) {
    let api = active === true ? "activate" : "deactivate";
    let info = await fetch(
        `https://develop.roblox.com/v1/universes/${universeId}/${api}`,
        {
            method: "POST",
            headers: {
                Referer: "https://www.roblox.com/",
                "User-Agent":
                    "Mozilla/5.0 (Windows NT 6.1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/92.0.4515.131 Safari/537.36 OPR/78.0.4093.186",
                "x-csrf-token": xcsrf,
                Cookie: `.ROBLOSECURITY=${cookie}`
            }
        }
    );
    return info;
}

async function setPublic(cookie, active) {
    let XCSRF = await getXCSRF(cookie);
    let universeId = await getStarterUniverse(cookie);
    if (universeId["error"]) return { error: "true" };

    return await setPublicUniverse(universeId, cookie, XCSRF, active);
}

// =========================
// UNIVERSE CONFIG + SOCIAL LINK
// =========================
async function setUniverseConfig(cookie, avatarType, socialName, socialUrl) {
    let XCSRF = await getXCSRF(cookie);
    let universeId = await getStarterUniverse(cookie);

    let info = await fetch(
        `https://develop.roblox.com/v2/universes/${universeId}/configuration`,
        {
            method: "PATCH",
            headers: {
                Referer: "https://www.roblox.com/",
                "User-Agent":
                    "Mozilla/5.0 (Windows NT 6.1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/92.0.4515.131 Safari/537.36 OPR/78.0.4093.186",
                "x-csrf-token": XCSRF,
                "Content-Type": "application/json",
                Cookie: `.ROBLOSECURITY=${cookie}`
            },
            body: `{"universeAvatarType": "MorphTo${avatarType}", "allowPrivateServers": true, "privateServerPrice": 0}`
        }
    );

    let secondxcsrf = await getXCSRF(cookie);

    await fetch(`https://develop.roblox.com/v1/universes/${universeId}/social-links`, {
        method: "POST",
        headers: {
            Referer: "https://www.roblox.com/",
            "User-Agent":
                "Mozilla/5.0 (Windows NT 6.1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/92.0.4515.131 Safari/537.36 OPR/78.0.4093.186",
            "X-CSRF-TOKEN": secondxcsrf,
            "Content-Type": "application/json",
            Cookie: `.ROBLOSECURITY=${cookie}`
        },
        body: `{"type":"Discord","url":"${socialUrl}","title":"${socialName}"}`
    });

    return info;
}

// =========================
// PLACE CONFIG
// =========================
async function setPlaceConfig(cookie, name, amount) {
    let XCSRF = await getXCSRF(cookie);
    let placeId = await getStarterPlace(cookie);

    let payload = { maxPlayerCount: amount };
    if (name != undefined) payload["name"] = name;

    return await fetch(`https://develop.roblox.com/v2/places/${placeId}`, {
        method: "PATCH",
        headers: {
            Referer: "https://www.roblox.com/",
            "User-Agent":
                "Mozilla/5.0 (Windows NT 6.1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/92.0.4515.131 Safari/537.36 OPR/78.0.4093.186",
            "x-csrf-token": XCSRF,
            "Content-Type": "application/json",
            Cookie: `.ROBLOSECURITY=${cookie}`
        },
        body: JSON.stringify(payload)
    });
}

// =========================
// DOWNLOAD URL
// =========================
async function getDownloadUrl(assetId) {
    let info = await fetch(
        `https://assetdelivery.roblox.com/v1/assetId/${assetId}`,
        {
            method: "GET",
            headers: {
                "User-Agent":
                    "Mozilla/5.0 (Windows NT 6.1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/92.0.4515.131 Safari/537.36 OPR/78.0.4093.186"
            }
        }
    );
    info = await info.json();
    return info.location;
}

// =========================
// MODEL UPLOAD
// =========================
async function uploadModel(content, cookie) {
    let xcsrf = await getXCSRF(cookie);

    return retryUntilSuccess(async () => {
        return await fetch(
            "http://data.roblox.com/Data/Upload.ashx?assetid=0&type=Model&name=module&description=module&genreTypeId=1&ispublic=false&allowcomments=false",
            {
                method: "POST",
                headers: {
                    "User-Agent": "Roblox/WinInet",
                    "x-csrf-token": xcsrf,
                    "Content-Type": "application/xml",
                    Cookie: `.ROBLOSECURITY=${cookie}`
                },
                body: content
            }
        );
    }, "uploadModel");
}

// =========================
// ENABLE VC (mock)
// =========================
async function enableVC(cookie) {
    return { status: 200 };
}

// =================
export {
    createAccount,
    randomString2,
    updatePlace,
    setPublic,
    setUniverseConfig,
    setPlaceConfig,
    enableVC,
    getDownloadUrl,
    uploadModel
};
