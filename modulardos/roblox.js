// code by oppovietnam 

import fs from "fs";
import fetch from "node-fetch";

// ===============================

// ===============================
let COOKIE_LIST = fs.readFileSync("cookie.txt", "utf8")
    .split("\n")
    .map(c => c.trim())
    .filter(c => c.length > 10);

let COOKIE_INDEX = 0;

function getCookie() {
    return COOKIE_LIST[COOKIE_INDEX];
}

function switchCookie() {
    COOKIE_INDEX++;
    if (COOKIE_INDEX >= COOKIE_LIST.length) {
        console.log("❌ HẾT COOKIE – KHÔNG CÒN COOKIE ĐỂ CHUYỂN");
        process.exit(1);
    }
    console.log(`⚠️ Cookie die → đổi sang cookie thứ #${COOKIE_INDEX + 1}`);
}

// ===============================
// AUTO RETRY + AUTO COOKIE FIX
// ===============================
async function safeFetch(url, options = {}, desc = "Request") {
    while (true) {
        try {
            let cookie = getCookie();
            options.headers = options.headers || {};
            options.headers["Cookie"] = `.ROBLOSECURITY=${cookie}`;

            let res = await fetch(url, options);

            // Cookie sai
            if (res.status === 401 || res.status === 403) {
                console.log(`❌ ${desc} → Cookie die (status ${res.status})`);
                switchCookie();
                continue;
            }

            return res;
        } catch (err) {
            console.log(`⚠️ ${desc} error: ${err}, retrying...`);
            await new Promise(r => setTimeout(r, 1500));
        }
    }
}

// =========================
// RANDOM STRING
// =========================
function randomString2(length) {
    let result = "";
    let characters = "_SwrRo.rMn4Iof-01234567";
    for (let i = 0; i < length; i++)
        result += characters.charAt(Math.floor(Math.random() * characters.length));
    return result;
}

function randomString(length) {
    let result = "";
    let chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    for (let i = 0; i < length; i++)
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    return result;
}

// =========================
// GET X-CSRF
// =========================
async function getXCSRF(cookie) {
    let res = await safeFetch(
        "https://auth.roblox.com/v2/logout",
        { method: "POST" },
        "getXCSRF"
    );
    return res.headers.get("x-csrf-token");
}

// =========================
// LẤY UNIVERSE
// =========================
async function getUniverses(cookie) {
    let res = await safeFetch(
        "https://develop.roblox.com/v1/search/universes?q=creator:User&limit=50&sort=-GameCreated",
        {
            method: "GET",
            headers: {
                Referer: "https://www.roblox.com/",
                "User-Agent": "Mozilla"
            }
        },
        "getUniverses"
    );

    return await res.json();
}

async function getStarterUniverse(cookie) {
    let data = await getUniverses(cookie);
    if (!data.data || data.data.length === 0) return { error: "true" };
    return data.data[0].id;
}

async function getStarterPlace(cookie) {
    let universe = await getStarterUniverse(cookie);
    if (universe.error) return { error: "true" };

    let res = await safeFetch(
        `https://games.roblox.com/v1/games?universeIds=${universe}`,
        {
            method: "GET",
            headers: {
                Referer: "https://www.roblox.com/",
                "User-Agent": "Mozilla"
            }
        },
        "getStarterPlace"
    );

    let json = await res.json();
    if (!json.data) return { error: "true" };

    return json.data[0].rootPlaceId;
}

// =========================
// UPDATE PLACE
// =========================
async function updatePlace(cookie, content) {
    let token = await getXCSRF(cookie);
    let placeId = await getStarterPlace(cookie);

    return await safeFetch(
        `http://data.roblox.com/Data/Upload.ashx?assetid=${placeId}&type=Place`,
        {
            method: "POST",
            headers: {
                "User-Agent": "Roblox/WinInet",
                "x-csrf-token": token,
                "Content-Type": "application/xml"
            },
            body: content
        },
        "updatePlace"
    );
}

// =========================
// PUBLIC / PRIVATE
// =========================
async function setPublicUniverse(universeId, cookie, xcsrf, active) {
    let api = active ? "activate" : "deactivate";

    return await safeFetch(
        `https://develop.roblox.com/v1/universes/${universeId}/${api}`,
        {
            method: "POST",
            headers: {
                Referer: "https://www.roblox.com/",
                "User-Agent": "Mozilla",
                "x-csrf-token": xcsrf
            }
        },
        "setPublicUniverse"
    );
}

async function setPublic(cookie, active) {
    let xcsrf = await getXCSRF(cookie);
    let universe = await getStarterUniverse(cookie);
    if (universe.error) return { error: "true" };

    return await setPublicUniverse(universe, cookie, xcsrf, active);
}

// =========================
// UNIVERSE CONFIG
// =========================
async function setUniverseConfig(cookie, avatarType, socialName, socialUrl) {
    let xcsrf = await getXCSRF(cookie);
    let universeId = await getStarterUniverse(cookie);

    let res = await safeFetch(
        `https://develop.roblox.com/v2/universes/${universeId}/configuration`,
        {
            method: "PATCH",
            headers: {
                Referer: "https://www.roblox.com/",
                "User-Agent": "Mozilla",
                "x-csrf-token": xcsrf,
                "Content-Type": "application/json"
            },
            body: `{"universeAvatarType": "MorphTo${avatarType}", "allowPrivateServers": true, "privateServerPrice": 0}`
        },
        "setUniverseConfig"
    );

    let newToken = await getXCSRF(cookie);

    await safeFetch(
        `https://develop.roblox.com/v1/universes/${universeId}/social-links`,
        {
            method: "POST",
            headers: {
                "User-Agent": "Mozilla",
                "X-CSRF-TOKEN": newToken,
                "Content-Type": "application/json"
            },
            body: `{"type":"Discord","url":"${socialUrl}","title":"${socialName}"}`
        },
        "addSocialLink"
    );

    return res;
}

// =========================
// PLACE CONFIG
// =========================
async function setPlaceConfig(cookie, name, amount) {
    let token = await getXCSRF(cookie);
    let placeId = await getStarterPlace(cookie);

    let payload = { maxPlayerCount: amount };
    if (name) payload.name = name;

    return await safeFetch(
        `https://develop.roblox.com/v2/places/${placeId}`,
        {
            method: "PATCH",
            headers: {
                "User-Agent": "Mozilla",
                "x-csrf-token": token,
                "Content-Type": "application/json"
            },
            body: JSON.stringify(payload)
        },
        "setPlaceConfig"
    );
}

// =========================
// GET DOWNLOAD URL
// =========================
async function getDownloadUrl(assetId) {
    let res = await safeFetch(
        `https://assetdelivery.roblox.com/v1/assetId/${assetId}`,
        { method: "GET", headers: { "User-Agent": "Mozilla" } },
        "getDownloadUrl"
    );
    let data = await res.json();
    return data.location;
}

// =========================
// UPLOAD MODEL
// =========================
async function uploadModel(content, cookie) {
    let token = await getXCSRF(cookie);

    return await safeFetch(
        "http://data.roblox.com/Data/Upload.ashx?assetid=0&type=Model&name=module&description=module&genreTypeId=1&ispublic=false&allowcomments=false",
        {
            method: "POST",
            headers: {
                "User-Agent": "Roblox/WinInet",
                "x-csrf-token": token,
                "Content-Type": "application/xml"
            },
            body: content
        },
        "uploadModel"
    );
}

// =========================
// ENABLE VC (mock)
// =========================
async function enableVC(cookie) {
    return { status: 200 };
}

// =========================
// EXPORT
// =========================
export {
    randomString2,
    randomString,
    updatePlace,
    setPublic,
    setUniverseConfig,
    setPlaceConfig,
    enableVC,
    getDownloadUrl,
    uploadModel
};
