const fs = require('fs')

const configuration = {
    owner: "24104371190", // Number Owner
    botNumber: "24104371190", // Number Bot
    setPair: "LORD SAKAMOTO MD",
    thumbUrl: "https://files.catbox.moe/g5n0hr.jpg",
    session: "sessions",
    status: {
        public: true,
        terminal: true,
        reactsw: false
    },
    message: {
        owner: "cette commandene peut êtreutilisée que par le propriétaires",
        group: "cette commandene peut peut être utiliserque dans les groupes",
        admin: "cet commandes ne peux être utilise que par un admin",
        private: "this is specifically for private chat"
    },
    settings: {
        title: "LORD SAKAMOTO MD",
        packname: 'SAKAMOTO',
        description: "Le code est une arme, le silence est un bouclier — ensemble, ils font d’un bot une légende",
        author: 'https://www.about-kyrie.site',
        footer: "Derrière chaque ligne de code se cache une stratégie. Un bot, c’est plus qu’un outil — c’est l’extension de ta volonté. `"
    },
    newsletter: {
        name: "SAKAMOTO Information",
        id: "242056610206@"
    },
    socialMedia: {
        YouTube: "https://youtube.com/@SAKAMOTOMD",
        GroupeW: "https://chat.whatsapp.com/EUPMgmQG238KEVLWnLmhFH?mode=ac_t",
        Telegram: "https://t.me/",
        ChannelWA: "https://whatsapp.com/channel/0029VbBFBxA1NCrVrBCF3g0F"
    }
}

module.exports = configuration;

let file = require.resolve(__filename)
require('fs').watchFile(file, () => {
  require('fs').unwatchFile(file)
  console.log('\x1b[0;32m'+__filename+' \x1b[1;32mupdated!\x1b[0m')
  delete require.cache[file]
  require(file)
})
