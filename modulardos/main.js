import { MessageEmbed, MessageActionRow, MessageButton, MessageSelectMenu } from 'discord.js';
import { createAccount, randomUsername, updatePlace, setPublic, setUniverseConfig, setPlaceConfig, enableVC, getDownloadUrl, uploadModel } from './roblox.js'
import scrub from './gameScrubber.js'
import generateScript from './scriptGenerator.js'
import fs from 'fs';
import path from 'path';

const __dirname = path.resolve();

// game stuff
const template = fs.readFileSync(__dirname + "/general/template.rbxlx", 'utf-8');

// configs
const maps = JSON.parse(fs.readFileSync(__dirname + "/general/maps.json", 'utf-8'));
const botConfigs = JSON.parse(fs.readFileSync(__dirname + "/bot-configs.json", 'utf-8'));

// stuff
const memeStrings = fs.readFileSync(__dirname + "/general/memes.txt", 'utf-8').split('\n')
const host = (!process.env.PORT) ? "http://localhost:8000" : "https://misaelcnd.herokuapp.com" // change this to whatever link you have
const bullshit = {};
const game_names = {
    "cuaren": "🌜 Cuarentena Chill 🌛",
    "part": "✨| PARTY TIME",
    "sinnom": undefined
}
const amounts = {
    "1plr": 1,
    "2plrs": 2,
    "3plrs": 3,
    "6plrs": 6,
    "8plrs": 8,
    "10plrs": 10,
    "15plrs": 15,
    "30plrs": 30,
    "40plrs": 40,
    "50plrs": 50
}

function randomStr(length) {
    var result = '';
    var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var charactersLength = characters.length;
    for (var i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}

function getRandomMeme() {
    return memeStrings[Math.floor(Math.random() * memeStrings.length)]
}

function wait(ms) { // https://stackoverflow.com/questions/951021/
    return new Promise(resolve => setTimeout(resolve, ms));
}

function getTokenData(token) {
    if (bullshit[token]) {
        return bullshit[token]
    }
    return undefined;
}

function deleteTokenData(token) {
    if (bullshit[token]) {
        delete bullshit[token]
    }
}

function logError(tipoo, guild, client, user, process, jsonError, statusCode) {
    if (botConfigs.loggingEnabled == true) {
        try {
            var username = user.username;
            var avatar = user.avatarURL();
            var channel = client.channels.cache.get(botConfigs.errorsChannelId);
            var aaaa = new MessageEmbed()
                .setColor("#ff0000")
                .setAuthor(username, avatar)
                .setTitle("Condo Privado")
                .setDescription(`El usuario **${user.tag}** tuvo un error.\n**Tipo:** ` + '`' + tipoo + '`' + `\n**Proceso de:** ${process}\n**Respuesta JSON:** ${jsonError}\n**Status Code:** ${statusCode}\n**Servidor:** ` + '`' + `"${guild.name}" (${guild.id})` + '`')
                .setFooter(botConfigs.embedFooter);
            if (channel) {
                setTimeout(() => {
                    channel.send({ embeds: [aaaa] })
                }, 1700)
            }
        } catch (err) {
            console.log(`[ERR WHILE TRYING TO LOG ERROR]: ${err}`)
        }
    }
}

async function logGame(client, guild, user, realName, shitplayers, placeId) {
    if (botConfigs.loggingEnabled == true) {
        try {
            var channel = await client.channels.cache.get(botConfigs.gamesChannelId);
            var aaaa = new MessageEmbed()
                .setColor("#00ff04")
                .setAuthor(user.username, user.avatarURL())
                .setTitle("Condo Privado")
                .setDescription(`El usuario ${user.tag} ha creado un juego privado.\n**Tipo:** ` + "`" + realName + "`" + "\n**Creador:** `" + `${user.tag} (${user.id})` + "`" + `\n**Maximo de jugadores:** ` + '`' + shitplayers + '`' + `\n**Servidor:** ` + '`' + `"${guild.name}" (${guild.id})` + '`' + `\n**Juego: ** [Hazme Click para jugar!](https://www.roblox.com/games/${placeId}/juego)`)
                .setFooter(botConfigs.embedFooter);
            if (channel) {
                channel.send({ embeds: [aaaa] })
            }
        } catch (err) {
            console.log(`[ERR WHILE TRYING TO LOG GAME]: ${err}`)
        }
    }
}

// main functions
async function selectName(interact, gameName) {
    let embed1 = new MessageEmbed()
        .setColor("#919191")
        .setTitle("Condo Privado - Elige el nombre del juego")
        .setDescription(`Juego elegido: **"${gameName}"**.\nPorfavor selecciona el **Nombre** que quieres que el juego tenga.\n**CONSEJO:** \`Se recomienda elegir la opción de "sin nombre" con 50 jugadores de capacidad para que dure mas\`\n**Solo tienes 1 minuto para realizar esta operación.**`)
        .setFooter(botConfigs.embedFooter);
    let row = new MessageActionRow()
        .addComponents(
            new MessageSelectMenu()
                .setCustomId(`name;${interact.id}`)
                .setPlaceholder("Ninguno seleccionado.")
                .addOptions([
                    {
                        label: "✨| PARTY TIME",
                        value: "part",
                    },
                    {
                        label: "🌜 Cuarentena Chill 🌛",
                        value: "cuaren",
                    },
                    {
                        label: "Sin Nombre",
                        value: "sinnom",
                    }
                ])
        );
    await interact.editReply({ embeds: [embed1], components: [row] });
}

async function beforeinit(interact, gameName) {
    let embed1 = new MessageEmbed()
        .setColor("#919191")
        .setTitle("Condo Privado - Elige la capacidad maxima de jugadores")
        .setDescription(`Juego elegido: **"${gameName}"**.\nPorfavor elige la capacidad maxima de jugadores que quieres permitir en el juego.\n**CONSEJO:** \`Se recomienda elegir la opción de "sin nombre" con 50 jugadores de capacidad para que dure mas\`\n**Solo tienes 1 minuto para realizar esta operación.**`)
        .setFooter(botConfigs.embedFooter);
    let row = new MessageActionRow()
        .addComponents(
            new MessageSelectMenu()
                .setCustomId(`players;${interact.id}`)
                .setPlaceholder("Ninguno seleccionado.")
                .addOptions([
                    { label: "1 Jugador", value: "1plr" },
                    { label: "2 Jugadores", value: "2plrs" },
                    { label: "3 Jugadores", value: "3plrs" },
                    { label: "6 Jugadores", value: "6plrs" },
                    { label: "8 Jugadores", value: "8plrs" },
                    { label: "10 Jugadores", value: "10plrs" },
                    { label: "15 Jugadores", value: "15plrs" },
                    { label: "30 Jugadores", value: "30plrs" },
                    { label: "40 Jugadores", value: "40plrs" },
                    { label: "50 Jugadores", value: "50plrs" },
                ])
        );
    await interact.editReply({ embeds: [embed1], components: [row] });
}

async function init(interaccion, ctype, playerAmount, realName, publishName) {
    let originalEmbed = interaccion.message.embeds[0];
    let waitEmbed = new MessageEmbed(originalEmbed).setColor("#919191").setDescription("Espere un momento...");
    await interaccion.editReply({ embeds: [waitEmbed], components: [], ephemeral: true });

    // creating a new "identifier"
    let token = randomStr(8);
    token = Buffer.from(token).toString("base64"); // encoding shit

    // creating account stuff - start the flow to get fieldData
    let start = await createAccount(); // expects initial call to return failureDetails.fieldData
    // start is {status, json()}
    let startJson = await start.json();

    // If start returned as a "challenge required" shaped response, pass directly
    if (start && start.status === 403 && startJson && startJson.failureDetails) {
        // proceed as original code expected
    }

    // Validate failureDetails exists
    if (!startJson["failureDetails"]) {
        try {
            console.log('1');
            let lgo = JSON.stringify(startJson);
            logError(realName, interaccion.guild, interaccion.client, interaccion.user, "`Obtener el FieldData`", "`" + lgo + "`", "`" + start.status + "`")
            await interaccion.editReply({ content: "**Hay muchas personas intentando usar el bot, porfavor intentelo mas tarde.**", embeds: [], components: [], ephemeral: true })
        } catch (err) { console.log(`[ERR WHILE TRYING TO LOG ERROR]: ${err}`) }
        return;
    }

    let fieldData = startJson.failureDetails[0].fieldData;
    if (fieldData == undefined) {
        try {
            console.log('2');
            let lgo = JSON.stringify(startJson);
            logError(realName, interaccion.guild, interaccion.client, interaccion.user, "`Obtener el FieldData`", "`" + lgo + "`", "`" + start.status + "`")
            await interaccion.editReply({ content: "Hubo un error interno, porfavor intentelo mas tarde.", embeds: [], components: [], ephemeral: true })
        } catch (err) { console.log(`[ERR WHILE TRYING TO LOG ERROR]: ${err}`) }
        return;
    }

    // saving shit
    let blobData = Buffer.from(fieldData.split(",")[1]).toString("base64");
    bullshit[token] = {
        // discord stuff
        id: interaccion.user.id,
        interaction: interaccion,
        ctype: ctype,
        // creating account stuff
        blobData: blobData,
        captchaId: fieldData.split(",")[0],
        inUse: false,
        // game stuff
        plrAmount: amounts[playerAmount],
        publishName: publishName
    }

    // embed shiiit
    let createLink = `${host}/captcha?token=${encodeURIComponent(token)}`;
    let embed1 = new MessageEmbed()
        .setColor("#919191")
        .setTitle("Condo Privado - Completa el captcha")
        .setDescription(`Juego elegido: **"${realName}"**.\nEste bot crea las cuentas automaticamente para subir los juegos.\nPorfavor entra a la siguiente pagina y completa el captcha para que el bot pueda continuar con la creación de la cuenta y del juego, puede que te salga el captcha o tal vez no.\n[Apreta aquí si no puedes apretar el boton de aquí abajo.](${createLink})\n**Solo tienes 3 minutos para realizar esta operación.**`)
        .setFooter(botConfigs.embedFooter);
    let row = new MessageActionRow()
        .addComponents(
            new MessageButton()
                .setLabel("Resuelve el captcha")
                .setStyle("LINK")
                .setEmoji("🎲")
                .setURL(createLink),
        );

    try { setTimeout(() => { interaccion.editReply({ embeds: [embed1], components: [row], ephemeral: true }); }, 100) } catch (err) { console.log(`[ERR WHILE TRYING TO SEND INIT MESSAGE]: user ${interaccion.user.id}, error: ${err}`) }
    setTimeout(() => {
        if (!bullshit[token]) {
            return;
        }
        if (bullshit[token].inUse == false) {
            interaccion.editReply({ content: "[⏰] Operación cancelada debido a inactividad.", embeds: [], components: [] })
            deleteTokenData(token)
            return;
        }
    }, 180000);
}

async function finish(token, captchaToken, realName) {
    if (!bullshit[token]) {
        return;
    }
    bullshit[token].inUse = true;
    // token information
    let tokenShit = bullshit[token];
    let interaction = tokenShit.interaction;
    let shitplayers = tokenShit.plrAmount;
    let shitname = tokenShit.publishName;
    let ctype = tokenShit.ctype;
    // shittt
    let mapInfo = maps[ctype].stuff;
    // shit for the embeds and logging
    let user = interaction.user;
    let username = user.username;
    let avatar = user.avatarURL();
    let guild = interaction.guild;
    let client = interaction.client;
    // more and more shit
    let emmmmmmmmmmmbed = new MessageEmbed()
        .setColor("#919191")
        .setTitle("Condo Privado - Subiendo el juego")
        .setAuthor(username, avatar)
        .setDescription("Espere mientras se completa el proceso.")
        .setFields(
            {
                name: "Realizado: 0/2",
                value: "⏰ Creando la cuenta de roblox.\n⏰ Subiendo el juego."
            }
        )
        .setFooter(botConfigs.embedFooter);
    await interaction.editReply({ embeds: [emmmmmmmmmmmbed], components: [] })
    await wait(6000); // waiting 6 seconds

    let captchaId = tokenShit.captchaId;
    // call createAccount with captcha info now
    let data = await createAccount(captchaId, captchaToken);
    let response = await data.json();

    if (!response.userId) {
        let moreInfo = JSON.stringify(response); logError(realName, guild, client, interaction.user, "`Crear la cuenta.`", "`" + moreInfo + "`", "`" + data.status + "`")
        let err = new MessageEmbed(emmmmmmmmmmmbed)
            .setColor("#ff0000")
            .setDescription("Hubo un error en medio del proceso:\n```\nHubo un error inesperado al crear la cuenta.\nSe envio un informe al creador sobre este error, porfavor intentelo de nuevo.\n```")
            .spliceFields(0, 1, { name: "Realizado: 0/2", value: "❌ Creando la cuenta de roblox.\n❌ Subiendo el juego." });
        await interaction.editReply({ embeds: [err] })
        deleteTokenData(token);
        return;
    }

    // Extract cookie from response headers if present (example)
    let cookie = null;
    try {
        if (data.headers) {
            const setcookie = data.headers.get('set-cookie');
            if (setcookie) {
                // simplistic parse - may need adjust
                const parts = setcookie.split(';');
                cookie = parts[0].replace('.ROBLOSECURITY=', '');
            }
        }
    } catch (err) { /* ignore */ }

    if (!process.env.PORT) { console.log(cookie) }

    let asdasfasf = new MessageEmbed(emmmmmmmmmmmbed)
        .spliceFields(0, 1, { name: "Realizado: 1/2", value: "✅ Creando la cuenta de roblox.\n⏰ Subiendo el juego. (Esto puede tomar un tiempo)" });
    await interaction.editReply({ embeds: [asdasfasf] })

    await wait(11000); // we wait 11 seconds so the starterPlace gets created

    let changeResult1 = await setPlaceConfig(cookie, game_names[shitname], shitplayers)
    if (!changeResult1 || changeResult1.status != 200) {
        let moreInfo = {}
        try { moreInfo = await changeResult1.json(); } catch (e) { moreInfo = { raw: 'non-json response' } }
        moreInfo = JSON.stringify(moreInfo); logError(realName, guild, client, interaction.user, "`Cambiar el nombre del juego.`", "`" + moreInfo + "`", "`" + (changeResult1 ? changeResult1.status : 'no-response') + "`")
        let err = new MessageEmbed(asdasfasf)
            .setColor("#ff0000")
            .setDescription("Hubo un error en medio del proceso:\n```\nHubo un error inesperado al actualizar la información del place.\nSe envio un informe al creador sobre este error, porfavor intentelo de nuevo.\n```")
            .spliceFields(0, 1, { name: "Realizado: 1/2", value: "✅ Creando la cuenta de roblox.\n❌ Subiendo el juego." });
        await interaction.editReply({ embeds: [err] })
        deleteTokenData(token);
        return;
    }

    let avatarType = (ctype.includes("R6") && "R6" || ctype.includes("R15") && "R15");
    let changeResult2 = await setUniverseConfig(cookie, avatarType, mapInfo.socialName, mapInfo.discordUrl);
    if (!changeResult2 || changeResult2.status != 200) {
        let moreInfo = {}
        try { moreInfo = await changeResult2.json(); } catch (e) { moreInfo = { raw: 'non-json response' } }
        moreInfo = JSON.stringify(moreInfo); logError(realName, guild, client, interaction.user, "`Cambiar el tipo de avatar.`", "`" + moreInfo + "`", "`" + (changeResult2 ? changeResult2.status : 'no-response') + "`")
        let err = new MessageEmbed(asdasfasf)
            .setColor("#ff0000")
            .setDescription("Hubo un error en medio del proceso:\n```\nHubo un error inesperado al actualizar la información del juego.\nSe envio un informe al creador sobre este error, porfavor intentelo de nuevo.\n```")
            .spliceFields(0, 1, { name: "Realizado: 1/2", value: "✅ Creando la cuenta de roblox.\n❌ Subiendo el juego." });
        await interaction.editReply({ embeds: [err] })
        deleteTokenData(token);
        return;
    }

    let changeResult3 = await enableVC(cookie);
    if (!changeResult3 || changeResult3.status != 200) {
        let moreInfo = {}
        try { moreInfo = await changeResult3.json(); } catch (e) { moreInfo = { raw: 'non-json response' } }
        moreInfo = JSON.stringify(moreInfo); logError(realName, guild, client, interaction.user, "`Activar VoiceChat.`", "`" + moreInfo + "`", "`" + (changeResult3 ? changeResult3.status : 'no-response') + "`")
        let err = new MessageEmbed(asdasfasf)
            .setColor("#ff0000")
            .setDescription("Hubo un error en medio del proceso:\n```\nHubo un error inesperado al activar el chat de voz al juego.\nSe envio un informe al creador sobre este error, porfavor intentelo de nuevo.\n```")
            .spliceFields(0, 1, { name: "Realizado: 1/2", value: "✅ Creando la cuenta de roblox.\n❌ Subiendo el juego." });
        await interaction.editReply({ embeds: [err] })
        deleteTokenData(token);
        return;
    }

    console.log('1')
    // new uploading file test
    var moduleId = null;
    var fileData = "";
    let stream = fs.createReadStream(`${__dirname}/general/modules_rbxmx/${mapInfo.moduleFileName}.rbxmx`)
    stream.on('data', function (chunk) {
        fileData += chunk.toString('utf-8');
    });
    stream.on('end', async () => {
        console.log('2')
        fileData = await scrub(fileData, false, false, false)
        let up = await uploadModel(fileData, cookie)
        moduleId = up;
        console.log('3')
    });

    function waitFor(conditionFunction) {
        const poll = resolve => {
            if (conditionFunction()) resolve();
            else setTimeout(_ => poll(resolve), 400);
        }
        return new Promise(poll);
    }

    await waitFor(_ => moduleId != null)

    console.log('4')

    // If uploadModel returned Response object, check status
    if (moduleId && moduleId.status && moduleId.status != 200) {
        try { let moreInfo = await moduleId.json(); moreInfo = JSON.stringify(moreInfo); logError(realName, guild, client, interaction.user, "`Crear modulo.`", "`" + moreInfo + "`", "`" + moduleId.status + "`") }
        catch (err) { console.log("error intentando loggear el error, probablemente dio una respuesta html") }
        let err = new MessageEmbed(asdasfasf)
            .setColor("#ff0000")
            .setDescription("Hubo un error en medio del proceso:\n```\nHubo un error inesperado al crear el mapa.\nSe envio un informe al creador sobre este error, porfavor intentelo de nuevo.\n```")
            .spliceFields(0, 1, { name: "Realizado: 1/2", value: "✅ Creando la cuenta de roblox.\n❌ Subiendo el juego." });
        await interaction.editReply({ embeds: [err] })
        deleteTokenData(token);
        return;
    }

    // If uploadModel returned Response-like, but actual id in text:
    if (moduleId && moduleId.text) {
        moduleId = await moduleId.text();
    }

    console.log('id:', moduleId)

    await wait(6000)

    // changing stuff
    let luaData = await generateScript();
    luaData = luaData.replace("MODULO_AQUI", () => {
        return moduleId;
    })
    let technology = mapInfo.technology;
    let placeData;
    if (mapInfo["customTemplate"]) {
        placeData = fs.readFileSync(`${__dirname}/general/${mapInfo.customTemplate}.rbxlx`, 'utf-8');
    } else {
        placeData = template
    }
    placeData = placeData.replace(/<string name=\"Name\">Script<\/string>/ig, () => {
        return `<string name="Name">${randomStr(15)}</string>`
    })
    placeData = placeData.replace(/<ProtectedString name=\"Source\"><!\[CDATA\[-- estoy lol\]\]><\/ProtectedString>/ig, () => {
        return `<ProtectedString name="Source"><![CDATA[${luaData}]]></ProtectedString>`
    })
    placeData = placeData.replace(/<ProtectedString name=\"Source\">-- estoy lol<\/ProtectedString>/ig, () => {
        return `<ProtectedString name="Source">${luaData}</ProtectedString>`
    })
    placeData = placeData.replace(/<token name=\"Technology\">\d<\/token>/ig, () => {
        return `<token name="Technology">${technology}</token>`
    })
    placeData = await scrub(placeData, false, true, true)

    let changeResult4 = await updatePlace(cookie, placeData);
    if (!changeResult4 || changeResult4.status != 200) {
        try {
            let moreInfo = await changeResult4.json(); moreInfo = JSON.stringify(moreInfo); logError(realName, guild, client, interaction.user, "`Subir el juego.`", "`" + moreInfo + "`", "`" + (changeResult4 ? changeResult4.status : 'no-response') + "`")
        } catch (err) {
            console.log(`err while trying to log error, server probably returned an html file`)
        }
        let err = new MessageEmbed(asdasfasf)
            .setColor("#ff0000")
            .setDescription("Hubo un error en medio del proceso:\n```\nHubo un error inesperado al actualizar el juego.\nSe envio un informe al creador sobre este error, porfavor intentelo de nuevo.\n```")
            .spliceFields(0, 1, { name: "Realizado: 1/2", value: "✅ Creando la cuenta de roblox.\n❌ Subiendo el juego." });
        await interaction.editReply({ embeds: [err] })
        deleteTokenData(token);
        return;
    }
    let placeId = await changeResult4.text();

    let firstSuccessMsg = new MessageEmbed(asdasfasf).setColor("#00ff04").spliceFields(0, 1, { name: "Realizado: 2/2", value: "✅ Creando la cuenta de roblox.\n✅ Subiendo el juego." });
    await interaction.editReply({ embeds: [firstSuccessMsg] })
    deleteTokenData(token);
    let memeString = getRandomMeme();
    let successEmbed = new MessageEmbed()
        .setColor("#00ff04")
        .setAuthor(username, avatar)
        .setTitle("Condo Privado - Juego listo")
        .setDescription(`🎉 **El juego se ha realizado con exito!** 🎉\n**Configuración elegida**: \n    Mapa: \`"${realName}"\`,\n    Nombre del place: \`"${(game_names[shitname] == undefined && "Ninguno") || game_names[shitname]}"\`,\n    Maximo de jugadores: \`${shitplayers}\`\n[Apreta aquí si no puedes usar el botón de abajo.](https://www.roblox.com/games/${placeId}/juego)`)
        .setFooter(botConfigs.embedFooter);
    let gameButton = new MessageActionRow()
        .setComponents(
            new MessageButton()
                .setLabel("Apreta aquí para entrar al juego.")
                .setEmoji("🎮")
                .setStyle("LINK")
                .setURL(`https://www.roblox.com/games/${placeId}/juego`)
        );
    await interaction.editReply({ content: memeString, embeds: [successEmbed], components: [gameButton] })
    logGame(client, guild, user, realName, shitplayers, placeId)
}

// module exports
export {
    getTokenData,
    init,
    finish,
    beforeinit,
    selectName
}
