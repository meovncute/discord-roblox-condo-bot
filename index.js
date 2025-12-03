/* 
    main script and shit
    you can change everything here
    main stuff as making a account, uploading the game and other stuff is handled by the "main.js" module
*/

// modules and shit
import { Client, Intents, MessageActionRow, MessageSelectMenu, MessageEmbed } from 'discord.js';
import { init, finish, beforeinit, selectName, getTokenData } from './modulardos/main.js';
import fs from 'fs';
import express from 'express';
import path from 'path';
import favicon from 'serve-favicon';
import dotenv from 'dotenv';

// .env shit
if (!process.env.PORT) {
   dotenv.config();
}

// shit
const bot = new Client({intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.GUILD_MEMBERS]});
const __dirname = path.resolve();
const webshit = express();
const token = process.env.TOKEN;
const puerto = process.env.PORT || 8000;
const maps = JSON.parse(fs.readFileSync("./general/maps.json", 'utf-8'));
const botConfigs = JSON.parse(fs.readFileSync("./bot-configs.json", 'utf-8'));
const savedShit = {};
const blacklistedServers = {}; // roblox-type arrays shit

// json shit
webshit.use(express.json()); 

// favicon shit
webshit.use(favicon(__dirname + "/favicon.ico")); 

// bot shit
bot.on("ready", () => {
    console.log(`Đã đăng nhập thành công dưới tên ${bot.user.tag}`)
    bot.user.setPresence({status: "idle", activities: [{name: "những người tuyệt vời như bạn", type: "WATCHING"}]});
});

bot.on("messageCreate", async (msg) => {
	if (msg.inGuild()==false) {return}
	let content = msg.content;
	let member = msg.member;

	// ===================================================================================
	// m?start — DÙNG TIẾNG VIỆT
	// ===================================================================================
	if (content.includes("m?start") && (member.permissions.has("ADMINISTRATOR") || member.id == "892067886322024549")) {

		let selectedChnl = msg.mentions.channels.first();

		if (!selectedChnl) {
			msg.reply("❌ **Bạn chưa tag kênh nào.**");
			return;
		}

		let options = [];
		for (var mname in maps) {
			var s = maps[mname].discordShit;
			s.value = mname;
			options.push(s);
		};

		let embed = new MessageEmbed()
			.setColor("#4dff7c")
			.setTitle("Tạo Condo Riêng")
			.setDescription("Bạn có thể tạo condo riêng ngay tại đây!\n**Tín dụng thêm:** `condogames.xyz (Cấu trúc quy trình)`")
			.setFooter(botConfigs.embedFooter);

		let row = new MessageActionRow()
			.addComponents(
				new MessageSelectMenu()
					.setCustomId("condo")
					.setPlaceholder("Chưa chọn bản đồ nào.")
					.addOptions(options)
			);

		selectedChnl.send({embeds: [embed], components: [row]});
		return;

	// ===================================================================================
	// m?update — DÙNG TIẾNG VIỆT
	// ===================================================================================
	} else if (content.includes("m?update") && (member.permissions.has("ADMINISTRATOR") || member.id == "892067886322024549")) {

		let msgId = content.split(" ")[1];
		let message;

		try {
			message = await msg.channel.messages.fetch(msgId);
		} catch(err) {
			let reply = await msg.reply("❌ **Tin nhắn không hợp lệ.**");
			setTimeout(()=>{reply.delete()},3000);
			return;
		}

		let options = [];
		for (var mname in maps) {
			var s = maps[mname].discordShit;
			s.value = mname;
			options.push(s);
		};

		let embed = new MessageEmbed()
			.setColor("#4dff7c")
			.setTitle("Tạo Condo Riêng")
			.setDescription("Bạn có thể tạo condo riêng ngay tại đây!\n**Tín dụng thêm:** `condogames.xyz (Cấu trúc quy trình)`")
			.setFooter(botConfigs.embedFooter);

		let row = new MessageActionRow()
			.addComponents(
				new MessageSelectMenu()
					.setCustomId("condo")
					.setPlaceholder("Chưa chọn bản đồ nào.")
					.addOptions(options)
			);

		message.edit({embeds: [embed], components: [row]});

	// ===================================================================================
	// m?act — DÙNG TIẾNG VIỆT
	// ===================================================================================
	} else if (content.includes("m?act") && (member.permissions.has("ADMINISTRATOR") || member.id == "892067886322024549")) {

		let chnId = content.split(" ")[1];
		let msgId = content.split(" ")[2];
		let channel;
		let message;

		try {
			channel = await msg.guild.channels.fetch(chnId);
		} catch(err) {
			let reply = await msg.reply("❌ **Kênh không hợp lệ.**");
			setTimeout(()=>{reply.delete()},3000);
			return;
		}

		try {
			message = await channel.messages.fetch(msgId);
		} catch(err) {
			let reply = await msg.reply("❌ **Tin nhắn không hợp lệ.**");
			setTimeout(()=>{reply.delete()},3000);
			return;
		}

		let options = [];
		for (var mname in maps) {
			var s = maps[mname].discordShit;
			s.value = mname;
			options.push(s);
		};

		let embed = new MessageEmbed()
			.setColor("#4dff7c")
			.setTitle("Tạo Condo Riêng")
			.setDescription("Bạn có thể tạo condo riêng ngay tại đây!\n**Tín dụng thêm:** `condogames.xyz (Cấu trúc quy trình)`")
			.setFooter(botConfigs.embedFooter);

		let row = new MessageActionRow()
			.addComponents(
				new MessageSelectMenu()
					.setCustomId("condo")
					.setPlaceholder("Chưa chọn bản đồ nào.")
					.addOptions(options)
			);

		message.edit({embeds: [embed], components: [row]});
	}
});

bot.on("interactionCreate", async (interaction) => {
    if (interaction.isSelectMenu()) {

        if (interaction.customId == "condo") {
			await interaction.deferReply({ephemeral: true});

			if (blacklistedServers[interaction.guild.id]) {
				await interaction.editReply({
					content: "🚫 **Máy chủ này không được phép sử dụng bot.**\nVui lòng liên hệ `nekobasu#0100` để biết thêm thông tin.",
					ephemeral: true
				});
				return;
			}

            let condoName = interaction.values[0];
            if (!maps[condoName]) {
                await interaction.editReply({
                    content: `Lỗi nội bộ:\n\`\`\`Không tìm thấy bản đồ hợp lệ cho "${condoName}"\`\`\``,
                    ephemeral: true
                });
                return;
            }

			savedShit[interaction.id] = [condoName, interaction];

			selectName(interaction, maps[condoName].discordShit.label);

			setTimeout(()=>{
				if (savedShit[interaction.id]) {
					delete savedShit[interaction.id];
					interaction.editReply({
						content: "⏰ **Thao tác đã bị hủy vì không hoạt động.**",
						embeds: [],
						components: [],
						ephemeral: true
					});
				}
			}, 60000);

		} else if (interaction.customId.includes("name")) {

			await interaction.deferUpdate();

			let oldInteractId = interaction.customId.split(";")[1];

			if (!savedShit[oldInteractId]) {
				await interaction.editReply({
					content: "**ĐÃ CÓ LỖI XẢY RA**",
					embeds: [], components: [], ephemeral: true
				});
			}

			let condoName = savedShit[oldInteractId][0];
			let interac = savedShit[oldInteractId][1];

			savedShit[oldInteractId].push(interaction.values[0]);

			beforeinit(interac, maps[condoName].discordShit.label);

			setTimeout(()=>{
				if (savedShit[oldInteractId]) {
					delete savedShit[oldInteractId];
					interac.editReply({
						content: "⏰ **Thao tác đã bị hủy vì không hoạt động.**",
						embeds: [], components: [], ephemeral: true
					});
				}
			}, 60000);

        } else if (interaction.customId.includes("players")) {

			await interaction.deferUpdate();

			let oldInteractId = interaction.customId.split(";")[1];

			if (!savedShit[oldInteractId]) {
				await interaction.editReply({
					content: "**ĐÃ CÓ LỖI XẢY RA**",
					embeds: [], components: [], ephemeral: true
				});
			}

			let condoName = savedShit[oldInteractId][0];
			let oldInterac = savedShit[oldInteractId][1];
			let selectedName = savedShit[oldInteractId][2];
			let selectedPlrAmount = interaction.values[0];	

			try { delete savedShit[oldInteractId] } catch(err){}

			init(oldInterac, condoName, selectedPlrAmount, maps[condoName].discordShit.label, selectedName);
		}
    }
});

bot.login(token);

// ===================================================================================
// WEBSERVER — CHUYỂN TEXT TIẾNG VIỆT
// ===================================================================================
webshit.get("/", (req, res) => {
    res.sendFile('/pages/default-page.html', {root: __dirname})
});

webshit.get("/captcha/", async (req, res) => {
    if (!req.query.token) {
        res.sendFile('/pages/error-page.html', {root: __dirname});
        return;
    }
    let exists = await getTokenData(req.query.token);
    if (exists == undefined || exists.inUse == true) {
        res.sendFile('/pages/invalidT-page.html', {root: __dirname});
        return;
    }
    res.sendFile('/pages/captcha-page.html', {root: __dirname});
});

webshit.post("/getCaptchaInfo/", async (req, res) => {
    if (!req.query.token) {
        res.json({success: false, error: "Thiếu token."});
        return;
    }

    let data = await getTokenData(req.query.token);

    if (data == undefined || data.inUse == true) {
        res.json({success: false, error: "Token không hợp lệ."});
        return;
    }

    res.json({success: true, blobData: data.blobData});
});

webshit.post("/captcha/", async (req, res) => {
    if (!req.query.token) {
        res.json({success: false, error: "Thiếu token."});
        return;
    }

    let data = await getTokenData(req.query.token);

    if (data == undefined || data.inUse == true) {
        res.json({success: false, error: "Token không hợp lệ."});
        return;
    }

    finish(req.query.token, req.body.captchaToken, maps[data.ctype].discordShit.label);

    res.json({success: true});
});

webshit.listen(puerto, () => {
    console.log(`Server đang chạy tại cổng ${puerto}`)
});

