const configuration = require('../settings/configuration');
const fs = require('fs');
const axios = require('axios');
const chalk = require('chalk');
const jimp = require('jimp');
const util = require('util');
const crypto = require('crypto');
const fetch = require('node-fetch');
const moment = require('moment-timezone');
const path = require('path');
const os = require('os');
const speed = require('performance-now');
const yts = require('yt-search');
const { spawn, exec, execSync } = require('child_process');
const { default: baileys, getContentType, proto, generateWAMessageFromContent } = require('@whiskeysockets/baileys');

module.exports = client = async (client, m, chatUpdate, store) => {
  try {
    const body = (
    m.mtype === 'conversation' ? m.message.conversation :
    m.mtype === 'imageMessage' ? m.message.imageMessage.caption :
    m.mtype === 'videoMessage' ? m.message.videoMessage.caption :
    m.mtype === 'extendedTextMessage' ? m.message.extendedTextMessage.text :
    m.mtype === 'buttonsResponseMessage' ? m.message.buttonsResponseMessage.selectedButtonId :
    m.mtype === 'listResponseMessage' ? m.message.listResponseMessage.singleSelectReply.selectedRowId :
    m.mtype === 'templateButtonReplyMessage' ? m.message.templateButtonReplyMessage.selectedId :
    m.mtype === 'interactiveResponseMessage' ? JSON.parse(m.msg.nativeFlowResponseMessage.paramsJson).id :
    m.mtype === 'templateButtonReplyMessage' ? m.msg.selectedId :
    m.mtype === 'messageContextInfo' ? m.message.buttonsResponseMessage?.selectedButtonId ||
    m.message.listResponseMessage?.singleSelectReply.selectedRowId || m.text : ''
    );

    const sender = m.key.fromMe
    ? client.user.id.split(':')[0] + '@s.whatsapp.net' || client.user.id
    : m.key.participant || m.key.remoteJid;

    const senderNumber = sender.split('@')[0];
    const budy = typeof m.text === 'string' ? m.text : '';
    const prefixRegex = /^[°zZ#$@*+,.?=''():√%!¢£¥€π¤ΠΦ_&><`™©®Δ^βα~¦|/\\©^]/;
    const prefix = prefixRegex.test(body) ? body.match(prefixRegex)[0] : '.';

    const from = m.key.remoteJid;
    const isGroup = m.key.remoteJid.endsWith('@g.us');
    const botNumber = await client.decodeJid(client.user.id);
    const isCreator = (m && m.sender && [botNumber, ...configuration.owner].map(v => v.replace(/[^0-9]/g, '') + '@s.whatsapp.net').includes(m.sender)) || false;
    const isBot = botNumber.includes(senderNumber);
  const groupMetadata = isGroup ? await client.groupMetadata(from) : {};
    const groupAdmins = isGroup ? groupMetadata.participants.filter(v => v.admin !== null).map(v => v.id) : [];
    const isAdmin = isGroup ? groupAdmins.includes(sender) : false;
    const isBotAdmin = isGroup ? groupAdmins.includes(botNumber) : false;
    const isCmd = body.startsWith(prefix);
    const command = isCmd ? body.slice(prefix.length).trim().split(' ').shift().toLowerCase() : '';
    const args = body.trim().split(/ +/).slice(1);

    const pushname = m.pushName || 'No Name';
    const text = q = args.join(' ');
    const quoted = m.quoted ? m.quoted : m;
    const mime = (quoted.msg || quoted).mimetype || '';
    const qmsg = (quoted.msg || quoted);
    const isMedia = /image|video|sticker|audio/.test(mime);

  const { smsg, fetchJson, sleep, formatSize, runtime, getBuffer } = require('../library/myfunction');
  const { fquoted } = require('../library/fquoted');

    const checkGroup = () => {
      if (!isGroup) return reply(configuration.message.group);
      if (!isBotAdmin) return reply(configuration.message.admin);
      if (!isCreator && !isAdmin) return reply(configuration.message.owner);
    };
    ///============== [ TERMINAL MESSAGE ] ================
    if (m.message) {
      console.log('\x1b[30m--------------------\x1b[0m');
      console.log(chalk.bgHex('#4a69bd').bold(`▢ New Message`));
      console.log(chalk.bgHex('#ffffff').black(
    `   ▢ Tanggal: ${new Date().toLocaleString()} \n` +
    `   ▢ Pesan: ${m.body || m.mtype} \n` +
    `   ▢ Pengirim: ${pushname} \n` +
    `   ▢ JID: ${senderNumber}`
      ));
      console.log();
    }

    ///============== [ ALL FUNCTION X PLUGIN LOADER ] ================

    // Fungsi Upload ke Catbox
    async function toCatBoxMoe(filePath) {
      try {
        const form = new FormData();
        form.append("fileToUpload", fs.createReadStream(filePath));
        form.append("reqtype", "fileupload");

        const response = await axios.post("https://catbox.moe/user/api.php", form, {
          headers: {
            ...form.getHeaders(),
            "User-Agent": "Mozilla/5.0"
          },
          maxBodyLength: Infinity,
          maxContentLength: Infinity
        });

        return response.data;
      } catch (error) {
      return `Error Catbox: ${error.message}`;
      }
    }

    const reaction = async (jidss, emoji) => {
      client.sendMessage(jidss, {
        react: {
          text: emoji,
          key: m.key
        }
      });
    };

    async function reply(text) {
      client.sendMessage(m.chat, {
        text: '\n' + text + '\n',
        contextInfo: {
          mentionedJid: [sender],
          externalAdReply: {
            title: configuration.settings.title,
            body: configuration.settings.description,
            thumbnailUrl: configuration.thumbUrl,
            sourceUrl: configuration.socialMedia.Telegram,
            renderLargerThumbnail: false
          }
        }
    }, { quoted: fquoted.packSticker });
    }

    const limitPath = path.join(__dirname, '../library/database/limit.json');
  if (!fs.existsSync(limitPath)) fs.writeFileSync(limitPath, '{}');

    let limitDB = JSON.parse(fs.readFileSync(limitPath));
    const defaultLimit = 32;

    const saveLimit = () => fs.writeFileSync(limitPath, JSON.stringify(limitDB, null, 2));

    const initLimit = (jid) => {
      if (!limitDB[jid]) {
        limitDB[jid] = {
          count: 0,
          lastReset: Date.now()
        };
        saveLimit();
      }
    };

    const resetIfNeeded = (jid) => {
      const now = Date.now();
      const resetTime = 24 * 60 * 60 * 1000; // 24 jam
      if (now - limitDB[jid].lastReset > resetTime) {
        limitDB[jid].count = 0;
        limitDB[jid].lastReset = now;
        saveLimit();
      }
    };

    const getLimit = (jid) => {
      initLimit(jid);
      resetIfNeeded(jid);
      return limitDB[jid].count;
    };

    const isLimitExceeded = (jid) => getLimit(jid) >= defaultLimit;

    const incrementLimit = (jid, val = 1) => {
      initLimit(jid);
      resetIfNeeded(jid);
      limitDB[jid].count += val;
      saveLimit();
    };

    const pluginsLoader = async (directory) => {
      let plugins = [];
      const folders = fs.readdirSync(directory);
      for (let file of folders) {
        const filePath = path.join(directory, file);
        if (filePath.endsWith('.js')) {
          try {
            const resolvedPath = require.resolve(filePath);
            if (require.cache[resolvedPath]) delete require.cache[resolvedPath];
            const plugin = require(filePath);
            plugins.push(plugin);
          } catch (error) {
          console.log(`${filePath}:`, error);
          }
        }
      }
      return plugins;
    };

    const pluginsDisable = true;
    const plugins = await pluginsLoader(path.resolve(__dirname, '../plugins'));

    const plug = {
      client,
      prefix,
      command,
      reply,
      text,
      isBot,
      reaction,
      pushname,
      mime,
      quoted,
      sleep,
      fquoted,
      fetchJson
    };

    for (let plugin of plugins) {
      if (plugin.command.find(e => e == command.toLowerCase())) {
        if (plugin.isBot && !isBot) return;
        if (plugin.private && !plug.isPrivate) return m.reply(configuration.message.private);
        if (typeof plugin !== 'function') return;
        await plugin(m, plug);
      }
    }

    if (!pluginsDisable) return;

    ///============== [ FEATURE LORD SAKAMOTO MD ] ================
    switch (command) {
      case 'menu': {
        if (!isCreator && !(isGroup && isAdmin)) {
          if (isLimitExceeded(sender)) return reply('❌ Tu as dépassé la limite recommandé.');
          incrementLimit(sender); // potong 1 limit
        }
        const userLimit = getLimit(sender);
        const sisa = defaultLimit - userLimit;
        const totalMem = os.totalmem();
        const freeMem = os.freemem();
        const usedMem = totalMem - freeMem;
        const formattedUsedMem = formatSize(usedMem);
        const formattedTotalMem = formatSize(totalMem);
        let timestamp = speed();
        let latensi = speed() - timestamp;

    let menu = `Dans l’ombre du code, la puissance se forge. Maîtrise ton bot, domine ton monde. 

> Statistic
▢ Limit: ${sisa} / ${defaultLimit}
▢ Speed: ${latensi.toFixed(4)} s
▢ Runtime: ${runtime(process.uptime())}
▢ Total RAM: ${formattedUsedMem} / ${formattedTotalMem}

⚙︎𓆪  LORD SAKAMOTO MD-  M E N U 𓆩⚙︎𓆪

🔍〔 𝗦𝗘𝗔𝗥𝗖𝗛 𝗠𝗢𝗗𝗨𝗟𝗘𝗦 〕
• ai  
• ytplay  

⬇️〔 𝗗𝗢𝗪𝗡𝗟𝗢𝗔𝗗 𝗖𝗘𝗡𝗧𝗘𝗥 〕
• ytmp3  
• ytmp4  

👥〔 𝗚𝗥𝗢𝗨𝗣 𝗖𝗢𝗠𝗠𝗔𝗡𝗗𝗦 〕
• tagall  
• hidetag  
• kick  
• kickall  
• promote  
• demote  
• setgroup  
• setppgc  
• public  
• private  
• link  
• revoke  

🎉〔 𝗙𝗨𝗡 𝗭𝗢𝗡𝗘 〕
• rate  
• love  
• fact  
• vv  
• weather  
.
𝙈𝘼𝘿𝙀 𝘽𝙔 𝙇𝙊𝙍𝘿 𝙎𝘼𝙆𝘼𝙈𝙊𝙏𝙊 𝙏𝙀𝘾𝙃.   
                       `;

        await client.sendMessage(m.chat, {
          productMessage: {
            title: '— ( LORD SAKAMOTO MD)',
            description: configuration.settings.description,
            thumbnail: configuration.thumbUrl,
            productId: '123456789',
            retailerId: 'TOKOKU',
            url: configuration.socialMedia.YouTube,
            body: menu,
            footer: configuration.settings.footer,
            buttons: [
            {
              name: 'cta_url',
              buttonParamsJson: JSON.stringify({
                display_text: 'soit mâture ',
                url: configuration.socialMedia.Telegram
              })
            }
            ]
          }
      }, { quoted: fquoted.packSticker });
      } break

      
      ///============== [ SEARCHING FEATURE ] ================

      case 'play':
      case 'ytplay': {
        if (!isCreator && !(isGroup)) {
          if (isLimitExceeded(sender)) return reply('❌ Ne dépasse pas la limite .');
          incrementLimit(sender); // potong 1 limit
        }
      if (!text) return reply(`Example: ${prefix + command} Lagu sad`);
        try {
        let search = await yts(`${text}`);
          if (!search || search.all.length === 0) return reply(`*Lagu tidak ditemukan!* ☹️`);

        let { videoId, image, title, views, duration, author, ago, url, description } = search.all[0];
let caption = `「 *YOUTUBE PLAY* 」\n\n🆔 ID : ${videoId}\n💬 Title : ${title}\n📺 Views : ${views}\n⏰ Duration : ${duration.timestamp}\n▶️ Channel : ${author.name}\n📆 Upload : ${ago}\n🔗 URL Video : ${url}\n📝 Description : ${description}`;

          client.sendMessage(m.chat,{
          image: { url: image },
            caption: caption,
          footer: `${global.footer}`,
            buttons: [
            {
          buttonId: `${prefix}ytmp3 ${url}`,
              buttonText: {
                displayText: "YouTube Music"
              }
            },
            {
          buttonId: `${prefix}ytmp4 ${url}`,
              buttonText: {
                displayText: "YouTube Video"
              }
            }
            ],
            viewOnce: true,
          }, {
            quoted: fquoted.packSticker
          });
        } catch (err) {
          reply(' 🖕🖕🖕🖕 *.raport teks*');
        }
      } break


      case 'ai': {
                await ask.sendMessage(m.chat, { react: { text: "🤖", key: m.key } });
                if (!text) return m.reply('Entrez votre question ou demande si tu veux porno va niquer ta daronne.');
                const response = await axios.get('https://text.pollinations.ai/'+text);
                const aiResponse = response.data;
                m.reply(aiResponse);
                break;
            }
      ///============== [ DOWNLOAD FEATURE ] ================

      case 'ytmp3': {
        if (!isCreator && !(isGroup)) {
          if (isLimitExceeded(sender)) return reply('❌ Limit.');
          incrementLimit(sender); // potong 1 limit
        }
        if (!text) return reply(`Masukkan URL YouTube!\n\nContoh: .ytmp3 https://www.youtube.com/watch?v=IcrbM1l_BoI`);

        try {
          reply('⏳ Sedang memproses...');
        let apiUrl = `https://api.vreden.my.id/api/ytmp3?url=${encodeURIComponent(text)}`;

          let res = await fetch(apiUrl);
          let json = await res.json();

          console.log("API JSON Response:", json);
          if (!json.status || !json.result || !json.result.download) {
            return reply(' link YouTube valid!');
          }

          let data = json.result;
          let download = data.download;

          let caption = `*「 YouTube MP3 」*\n\n` +
        `🎵 *Judul*: ${data.metadata.title}\n` +
        `⏳ *Durasi*: ${data.metadata.timestamp}\n` +
        `👀 *Views*: ${data.metadata.views.toLocaleString()} kali\n` +
        `📝 *Channel*: ${data.metadata.author.name}\n` +
        `🔗 *Link Video*: ${data.metadata.url}`;

          let audioBuffer = await getBuffer(download.url);


          await client.sendMessage(m.chat, {
            audio: audioBuffer,
            mimetype: 'audio/mpeg',
          fileName: `${download.filename || 'audio.mp3'}`
        }, { quoted: fquoted.packSticker });

        } catch (e) {
          console.error("Error ytmp3:", e);
          reply('Error data.');
        }
      } break;

      case 'ytmp4': {
        if (!isCreator && !(isGroup)) {
          if (isLimitExceeded(sender)) return reply('❌ Limit');
          incrementLimit(sender); // potong 1 limit
        }
        if (!text) return reply(`Masukkan URL YouTube!\n\nContoh: .ytmp4 https://youtube.com/watch?v=KHgllosZ3kA`);

        try {
          reply('⏳ Sedang memproses...');
        let apiUrl = `https://api.vreden.my.id/api/ytmp4?url=${encodeURIComponent(text)}`;

          let res = await fetch(apiUrl);
          let json = await res.json();

          console.log("API JSON Response:", json);
          if (!json.status || !json.result || !json.result.download) {
            return reply(' link YouTube valid!');
          }

        let { metadata, download } = json.result;
        let { title } = metadata;
        let { url, filename } = download;


          let videoBuffer = await getBuffer(url);


          await client.sendMessage(m.chat, {
            video: videoBuffer,
            mimetype: 'video/mp4',
          fileName: filename || `${title}.mp4`,
          caption: `*「 YouTube MP4 」*\n\n📺 *Judul*: ${title}`
        }, { quoted: fquoted.packSticker });

        } catch (e) {
          console.error("Error ytmp4:", e);
          reply('Error data.');
        }
      } break;

      
            case "private": {
                await client.sendMessage(m.chat, { react: { text: "🔒", key: m.key } });
                if (!isCreator) m.reply('Seul le propriétaire peut utiliser cette commande.');
                client.public = false;
                m.reply('`𝙡𝙚 𝙢𝙤𝙙𝙚 𝙥𝙧𝙞𝙫é 𝙚𝙨𝙩 𝙖𝙘𝙩𝙞𝙫é`');
                break;
            }

             
            case "public": {
                await client.sendMessage(m.chat, { react: { text: "🔓", key: m.key } });
                if (!isCreator) m.reply('Seul le propriétaire peut utiliser cette commande.');
                client.public = true;
                m.reply('`𝙡𝙚 𝙢𝙤𝙙𝙚 𝙥𝙪𝙗𝙡𝙞𝙘 𝙚𝙨𝙩 𝙖𝙘𝙩𝙞𝙫é`');
                break;
            }


      ///============== [ GROUPS FEATURE ] ================

      case 'tagall': {
        if (!isBot) return;
        const textMessage = args.join('💘 ') || 'bonjour tout le monde';
      let teks = `tagall message:\n> *${textMessage}*\n\n`;

        const groupMetadata = await client.groupMetadata(m.chat);
        const participants = groupMetadata.participants;

        for (let mem of participants) {
        teks += `@${mem.id.split('@')[0]}\n`;
        }

        client.sendMessage(m.chat, {
          text: teks,
          mentions: participants.map(a => a.id)
      }, { quoted: fquoted.packSticker });
      } break;

      case 'add': {
        checkGroup(); // validasi grup

      if (!text) return reply(`*Essaie comme ça :* ${prefix + command} 241xxxx`);

        const target = text.replace(/[^0-9]/g, '') + '@s.whatsapp.net';
        await client.groupParticipantsUpdate(m.chat, [target], 'add')
        .then(() => reply('✅ Succès !'))
        .catch(() => reply('Désole !\n• numéro \n• Cette commande est réservé au groupe.'));
      } break;

      case 'kick': {
        checkGroup(); // validasi grup

        let target;
        if (m.quoted) {
          target = m.quoted.sender;
        } else if (text) {
          target = text.replace(/[^0-9]/g, '') + '@s.whatsapp.net';
        } else {
        return reply(`*Essaie en faisant:* ${prefix + command} @tag/reply/241xxxx`);
        }

        if (target === sender) return reply('❌ 🖕');
        if (target === botNumber) return reply('❌RASENGAN !');

        await client.groupParticipantsUpdate(m.chat, [target], 'remove')
        .then(() => reply('✅ Succès '))
        .catch(() => reply(' Expulsion.'));
      } break;

      case 'promote': {
        checkGroup();

        let target;
        if (m.quoted) {
          target = m.quoted.sender;
        } else if (text) {
          target = text.replace(/[^0-9]/g, '') + '@s.whatsapp.net';
        } else {
        return reply(`*Fait comme ça:* ${prefix + command} @tag/reply/241xxxx`);
        }

        await client.groupParticipantsUpdate(m.chat, [target], 'promote')
        .then(() => reply('✅ vous ete désormais admis admin!'))
        .catch(() => reply(' 🤐.'));
      } break;

      case 'demote': {
        checkGroup();

        let target;
        if (m.quoted) {
          target = m.quoted.sender;
        } else if (text) {
          target = text.replace(/[^0-9]/g, '') + '@s.whatsapp.net';
        } else {
        return reply(`*Ce format là:* ${prefix + command} @tag/reply/241xxxx`);
        }

        await client.groupParticipantsUpdate(m.chat, [target], 'demote')
        .then(() => reply('✅ un bâtard est plus admin!'))
        .catch(() => reply('😎 .'));
      } break;

      case 'setpp': {
        checkGroup();
        if (!m.quoted || !/image/.test(mime)) return reply('❌ Recommence.');
        let media = await client.downloadMediaMessage(quoted);
        await client.updateProfilePicture(m.chat, media)
        .then(() => reply('✅ Changement de profil réussi !'))
        .catch(() => reply('technologiaaaaaaaaaaaa .'));
      } break;

      case 'hidetag': {
        checkGroup();
      if (!text && !m.quoted) return reply(`*🖕🖕🖕🖕:* ${prefix + command} ou êtes vous??!`);

        const isi = text ? text : m.quoted?.text || ' ';
        const mention = groupMetadata.participants.map(a => a.id);

        await client.sendMessage(m.chat, {
          text: isi,
          mentions: mention
      }, { quoted: fquoted.packSticker });
      } break;

      case 'setgroup': {
        checkGroup();

        const subcmd = args[0];
        if (!subcmd || !['open', 'close'].includes(subcmd)) {
      return reply(`*Allah Akba :* ${prefix + command} open\nAllah Akba 🤧😂😂😂\n\n${prefix + command} close\nNous sommes des AL QUAIDA`);
        }

        if (subcmd === 'open') {
          await client.groupSettingUpdate(m.chat, 'not_announcement')
          .then(() => reply('✅ Groupe ouvert .'))
          .catch(() => reply('SUCCES.'));
        }

        if (subcmd === 'close') {
          await client.groupSettingUpdate(m.chat, 'announcement')
          .then(() => reply('✅ Groupe fermé.'))
          .catch(() => reply('SUCCES.'));
        }
      } break;

      ///============== [ FUN FEATURE ] ================

case 'rate': {
    let rate = Math.floor(Math.random() * 101)
    m.reply(`Je te donne ${rate}% de cool 😎`)
    break;
}

case 'fact': {
    let facts = ['Les abeilles peuvent reconnaître les visages humains.', 'Le cœur d’un poulpe est dans sa tête.', 'Les chats ont plus de 20 muscles dans chaque oreille.']
    m.reply(`📘 Fait amusant: ${facts[Math.floor(Math.random() * facts.length)]}`)
    break;
}

case 'coin': {
    let coin = ['Pile 🪙', 'Face 🪙']
    m.reply(`🪙 Résultat: ${coin[Math.floor(Math.random() * 2)]}`)
    break;
}

case 'love': {
    let love = Math.floor(Math.random() * 101)
    m.reply(`💘 Ton taux d'amour est de ${love}%`)
    break;
}

case 'weather': {
    m.reply('🌦️ La météo est belle aujourd’hui (simulation)')
    break;
}

case 'vv': {
    if (!m.quoted) return m.reply('Répond à un message pour voir les vues.')
    if (!m.quoted.viewOnce) return m.reply('Ce message n’est pas une vue unique.')
    let msg = m.quoted
    msg.viewOnce = false
    client.copyNForward(m.chat, msg, true, { quoted: m })
    break;
}
     
      ///============== [ BATAS AKHIR FEATURE ] ================

      default:
    }
  } catch (err) {
    console.log(util.format(err));
  }
};

let file = require.resolve(__filename);
require('fs').watchFile(file, () => {
  require('fs').unwatchFile(file);
  console.log('\x1b[0;32m' + __filename + ' \x1b[1;32mupdated!\x1b[0m');
  delete require.cache[file];
  require(file);
});
