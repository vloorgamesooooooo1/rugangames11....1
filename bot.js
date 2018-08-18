const { Client, Util } = require('discord.js');
const YouTube = require('simple-youtube-api');
const ytdl = require('ytdl-core');

const client = new Client({ disableEveryone: true });
const GOOGLE_API_KEY = 'AIzaSyAdORXg7UZUo7sePv97JyoDqtQVi3Ll0b8';
const youtube = new YouTube(GOOGLE_API_KEY);

const queue = new Map();
const PREFIX = '1';
client.on('warn', console.warn);

client.on('error', console.error);

client.on('ready', () => { 
console.log(`
------------------------------------------------------
> Logging in...
------------------------------------------------------
Logged in as ${client.user.tag}
Working on ${client.guilds.size} servers!
${client.channels.size} channels and ${client.users.size} users cached!
I am logged in and ready to roll!
LET'S GO!
------------------------------------------------------
-------------------------------------------------------
------------------------------------------------------
----------------------Bot's logs----------------------`);


});

client.on('ready', function(){
    client.user.setStatus("dnd");
    var ms = 10000 ;
    var setGame = [`${PREFIX}help`];
    var i = -1;
    var j = 0;
    setInterval(function (){
        if( i == -1 ){
            j = 1;
        }
        if( i == (setGame.length)-1 ){
            j = -1;
        }
        i = i+j;
    }, ms);10000

});

client.on('disconnect', () => console.log('I just disconnected, making sure you know, I will reconnect now...'));

client.on('reconnecting', () => console.log('I am reconnecting now!'));

client.on('message', async msg => { // eslint disable line
    if (msg.author.bot) return undefined;
    if (!msg.content.startsWith(PREFIX)) return undefined;
    const args = msg.content.split(' ');
    const searchString = args.slice(1).join(' ');
    const url = args[1] ? args[1].replace(/<(.+)>/g, '$1') : '';
    const serverQueue = queue.get(msg.guild.id);

    if (msg.content.startsWith(`${PREFIX}play`)) {
        console.log(`${msg.author.tag} has been used the ${PREFIX}play command in ${msg.guild.name}`);

        const voiceChannel = msg.member.voiceChannel;
        if (!voiceChannel) return msg.channel.send({embed: {
            color: 15158332,
            fields: [{
                name: "خطآ",
                value: 'عليك التوآجد بروم صوتي لتشغيل الآغاني '
              }
            ]
          }
        });
		const permissions = voiceChannel.permissionsFor(msg.client.user);
		if (!permissions.has('CONNECT')) {
            return msg.channel.send({embed: {
                color: 15158332,
                fields: [{
                    name: "خطآ",
                    value: 'لا آستطيع الدخول آلى الروم المتوآجد فيهآ , تآكد من وجود صلاحيآت الروم معي'
                  }
                ]
              }
            });
		}
		if (!permissions.has('SPEAK')) {
			return msg.channel.send({embed: {
                color: 15158332,
                fields: [{
                    name: "خطآ",
                    value: 'لا آستطيع الدخول آلى الروم المتوآجد فيهآ , تآكد من وجود صلاحيآت الروم معي'
                  }
                ]
              }
            });
        }
        
        if (url.match(/^https?:\/\/(www.youtube.com|youtube.com)\/playlist(.*)$/)) {
            const playlist = await youtube.getPlaylist(url);
            const videos = await playlist.getVideos();
            for (const video of Object.values(videos)) {
                const video2 = await youtube.getVideoByID(video.id); // eslint-disable-line no-await-in-loop
                await handleVideo(video2, msg, voiceChannel, true) // eslint-disable-line no-await-in-loop
            }
            return msg.channel.send({embed: {
                color: 15158332,
                fields: [{
                    name: "آضافة الآغنية",
                    value: `Playlist: **${playlist.title}** تمت آضافة الآغنية الى الآغاني`
                  }
                ]
              }
            });
        } else {
            try {
                var video = await youtube.getVideo(url);
            } catch (error) {
                try {
                    var videos = await youtube.searchVideos(searchString, 10);
                    let index = 0;
                    msg.channel.send({embed: {
                        color: 15158332,
                        fields: [{
                            name: "آختر الآغنية بكتآبة رقمهآ",
                            value: `${videos.map(video2 => `\`${++index}\` **-** ${video2.title}`).join('\n')}`
                          },
                          {
                              name: "لديك فقط 10 ثوآني للآختيار",
                              value: "تآكد من آختيار الآغنية في الآئحة من 1 آلى 10"
                          }
                        ]
                      }
                    }).then(message =>{message.delete(20000)})
                    // eslint-disable-next-line max-depth
                    try {
                        var response = await msg.channel.awaitMessages(msg2 => msg2.content > 0 && msg2.content < 11, {
                            maxMatches: 1,
                            time: 10000,
                            errors: ['time']
                        });
                    } catch (err) {
                        console.error(err);
                        return msg.channel.send({embed: {
                            color: 15158332,
                            fields: [{
                                name: "خطآ",
                                value: 'لم يتم آختيار الآغنية ,  آنتهى وقت الآختيار'
                              }
                            ]
                          }
                        }).then(message =>{message.delete(5000)})
                    }
                    const videoIndex = (response.first().content);
                    var video = await youtube.getVideoByID(videos[videoIndex - 1].id);
                } catch (err) {
                    console.error(err);
                    return msg.channel.send({embed: {
                        color: 15158332,
                        fields: [{
                            name: "خطآ",
                            value: 'لم آعثر على آي نتيجة من آختيارك'
                          }
                        ]
                      }
                    }).then(message =>{message.delete(5000)})
                }
            }

            return handleVideo(video, msg, voiceChannel);
        }
    } else if (msg.content.startsWith(`${PREFIX}skip`)) {
        console.log(`${msg.author.tag} has been used the ${PREFIX}skip command in ${msg.guild.name}`);
        if (!msg.member.voiceChannel) return msg.channel.send({embed: {
            color: 15158332,
            fields: [{
                name: "خطآ",
                value: 'لست في روم صوتي'
              }
            ]
          }
        }).then(message =>{message.delete(5000)})
        if (!serverQueue) return msg.channel.send({embed: {
            color: 15158332,
            fields: [{
                name: "خطآ",
                value: 'لا توجد آي آغنية حآليآ لآستخدآم آمر تخطي آغنية'
              }
            ]
          }
        }).then(message =>{message.delete(5000)})
        serverQueue.connection.dispatcher.end();
        return undefined;
    } else if (msg.content.startsWith(`${PREFIX}stop`)) {
        console.log(`${msg.author.tag} has been used the ${PREFIX}stop command in ${msg.guild.name}`);
        if (!msg.member.voiceChannel) return msg.channel.send({embed: {
            color: 15158332,
            fields: [{
                name: "خطآ",
                value: 'لست في روم صوتي'
              }
            ]
          }
        }).then(message =>{message.delete(5000)})
        if (!serverQueue) return msg.channel.send({embed: {
            color: 15158332,
            fields: [{
                name: "خطآ",
                value: 'لا توجد آي آغنية حآليآ لآستخدآم آمر تخطي آغنية'
              }
            ]
          }
        }).then(message =>{message.delete(5000)})
        serverQueue.songs = [];
        serverQueue.connection.dispatcher.end('تم آستعمآل خآصية التوقيف');
        return undefined;
    } else if (msg.content.startsWith(`${PREFIX}volume`)) {
        console.log(`${msg.author.tag} has been used the ${PREFIX}volume command in ${msg.guild.name}`);
        if (!msg.member.voiceChannel) return msg.channel.send({embed: {
            color: 15158332,
            fields: [{
                name: "خطآ",
                value: 'لست في روم صوتي'
              }
            ]
          }
        }).then(message =>{message.delete(5000)})
        if (!serverQueue) return msg.channel.send({embed: {
            color: 15158332,
            fields: [{
                name: "خطآ",
                value: 'لا توجد آي آغنية شغآلة حآليا'
              }
            ]
          }
        }).then(message =>{message.delete(5000)})
        if (!args[1]) return msg.channel.send({embed: {
            color: 15158332,
            fields: [{
                name: "الصوت",
                value: `تم تغيير الصوت الحآلي آلى **${serverQueue.volume}**`
              }
            ]
          }
        }).then(message =>{message.delete(5000)})
        serverQueue.volume = args[1];
        serverQueue.connection.dispatcher.setVolumeLogarithmic(args[1] / 5);
        return msg.channel.send({embed: {
            color: 15158332,
            fields: [{
                name: "الصوت",
                value: `تم وضع الصوت آلى  **${args[1]}**`
              }
            ]
          }
        }).then(message =>{message.delete(5000)})
    } else if (msg.content.startsWith(`${PREFIX}np`)) {
        console.log(`${msg.author.tag} has been used the ${PREFIX}np command in ${msg.guild.name}`);
        if (!serverQueue) return msg.channel.send({embed: {
            color: 15158332,
            fields: [{
                name: "خطآ",
                value: 'لا توجد آي آغنية حآليآ لآستخدآم آمر تخطي آغنية'
              }
            ]
          }
        }).then(message =>{message.delete(5000)})
        return msg.channel.send({embed: {
            color: 15158332,
            fields: [{
                name: "يتم تشغيل الآغنية ...",
                value: `**${serverQueue.songs[0].title}**`
              }
            ]
          }
        }).then(message =>{message.delete(5000)})
    } else if (msg.content.startsWith(`${PREFIX}queue`)) {
        console.log(`${msg.author.tag} has been used the ${PREFIX}queue command in ${msg.guild.name}`);
        if (!serverQueue) return msg.channel.send({embed: {
            color: 15158332,
            fields: [{
                name: "خطآ",
                value: 'لا توجد آي آغنية حآليآ لآستخدآم آمر تخطي آغنية'
              }
            ]
          }
        }).then(message =>{message.delete(5000)})
        return msg.channel.send({embed: {
            color: 15158332,
            fields: [{
                name: "الآغنية الموآلية",
                value: `${serverQueue.songs.map(song => `**- ${song.title}**`).join('\n')}`
              },
              {
                  name: "يتم تشغيل الآغنية ...",
                  value: `**${serverQueue.songs[0].title}**`
              }
            ]
          }
        }).then(message =>{message.delete(5000)})
        } else if(msg.content.startsWith(`${PREFIX}help`)) {
        console.log(`${msg.author.tag} has been used the ${PREFIX}help command in ${msg.guild.name}`);

        msg.channel.send('** شيك عاخآص ي حلو , :inbox_tray: **').then(message =>{message.delete(5000)})

        msg.react('✅');

        msg.author.send({embed: {
            color: 15158332,
            author: {
              name: client.user.username,
              icon_url: client.user.avatarURL
            },
            fields: [{
                name: "آوامر البوت",
                value: `**${PREFIX}help** - معلومآت البوت ,\n\
**${PREFIX}play** - لآختيار وتشغيل الآغاني المطلوبة\n\
**${PREFIX}skip** - لتخطي الآغنية \n\
**${PREFIX}stop** - لتغيير صوت البوت \n\
**${PREFIX}np** - الآغنية المشغلة حآليآ\n\
**${PREFIX}queue** - لرؤية الآغاني الموآلية\n\
**${PREFIX}pause** - لتوقيف الآغنية\n\
**${PREFIX}resume** - لآكمآل الآغنية`
              }
            ],
            timestamp: new Date(),
            footer: {
              icon_url: client.user.avatarURL,
              text: "© AG STORE"
            }
          }
        });
    } else if (msg.content.startsWith(`${PREFIX}pause`)) {
        console.log(`${msg.author.tag} has been used the ${PREFIX}pause command in ${msg.guild.name}`);
        if (serverQueue && serverQueue.playing) {
            serverQueue.playing = false;
        serverQueue.connection.dispatcher.pause();
        return msg.channel.send({embed: {
            color: 15158332,
            fields: [{
                name: "آيقآف",
                value: 'تم توقيف الآغنية ,'
              }
            ]
          }
        }).then(message =>{message.delete(5000)})
        }
        return msg.channel.send({embed: {
            color: 15158332,
            fields: [{
                name: "خطآ",
                value: 'لا توجد آي آغنية شغآلة حآليا'
              }
            ]
          }
        }).then(message =>{message.delete(2000)})
    } else if (msg.content.startsWith(`${PREFIX}resume`)) {
        console.log(`${msg.author.tag} has been used the ${PREFIX}resume command in ${msg.guild.name}`);

        if (serverQueue && !serverQueue.playing) {
            serverQueue.playing =  true;
            serverQueue.connection.dispatcher.resume();
            return msg.channel.send({embed: {
                color: 15158332,
                fields: [{
                    name: "موآصلة",
                    value: 'يتم موآصلة الآغنية ,'
                  }
                ]
              }
            }).then(message =>{message.delete(5000)})
        }
        return msg.channel.send({embed: {
            color: 15158332,
            fields: [{
                name: "خطآ",
                value: 'ليس هنآك شيء شغال حآليا آو هنآك آغنية في طور التشغيل'
              }
            ]
          }
        }).then(message =>{message.delete(5000)})
    }

    return undefined;
});


async function handleVideo(video, msg, voiceChannel, playlist = false) {
    const serverQueue = queue.get(msg.guild.id);
        const song = {
            id: video.id,
            title: Util.escapeMarkdown(video.title),
            url: `https://www.youtube.com/watch?v=${video.id}`
        };
        if (!serverQueue) {
            const queueConstruct = {
                textChannel: msg.channel,
                voiceChannel: voiceChannel,
                connection: null,
                songs: [],
                volume: 5,
                playing: true
            };
            queue.set(msg.guild.id, queueConstruct);

            queueConstruct.songs.push(song);

            try {
                var connection = await voiceChannel.join();
                queueConstruct.connection = connection;
                play(msg.guild, queueConstruct.songs[0]);
            } catch (error) {
                console.error(`I could not join the voice channel: ${error}`);
                queue.delete(msg.guild.id);
                return msg.channel.send({embed: {
                    color: 15158332,
                    fields: [{
                        name: "خطآ",
                        value: `لآ آستطيل الدخول الى الروم: ${error}`
                      }
                    ]
                  }
                });
            }
        } else {
            serverQueue.songs.push(song);
            if (playlist) return undefined;
            else return msg.channel.send({embed: {
                color: 15158332,
                fields: [{
                    name: "آضافة آغنية",
                    value: `**${song.title}** تمت آضافة آغنية آلى الآغاني الموالية`
                  }
                ]
              }
            }).then(message =>{message.delete(5000)})
        }
        return undefined;
}

function play(guild, song) {
    const serverQueue = queue.get(guild.id);

    if (!song) {
        serverQueue.voiceChannel.leave();
        queue.delete(guild.id);
        return;
    }

    const dispatcher = serverQueue.connection.playStream(ytdl(song.url))
        .on('end', () => {
            console.log('Song ended.');
            serverQueue.songs.shift();
            play(guild, serverQueue.songs[0]);
        })
        .on('error', error => console.log(error));
    dispatcher.setVolumeLogarithmic(serverQueue.volume / 5);

    serverQueue.textChannel.send({embed: {
        color: 15158332,
        fields: [{
            name: "بدآ  التشغيل",
            value: `بدآ تشغيل: **${song.title}**`
          }
        ]
      }
    }).then(message =>{message.delete(5000)})
}

client.on('message', message => {
  if (!message.content.startsWith(PREFIX)) return;
  var args = message.content.split(' ').slice(1);
  var argresult = args.join(' ');
  if (message.author.id !== "408926307372498945") return;

if (message.content.startsWith(PREFIX + 'setstream')) {
  client.user.setGame(argresult, "https://www.twitch.tv/darkknite55");
	 console.log('test' + argresult);
    message.channel.sendMessage(`Streaming: **${argresult}`)
}

if (message.content.startsWith(PREFIX + 'setname')) {
  client.user.setUsername(argresult).then
	  message.channel.sendMessage(`تم تغيير آسم البوت بنجآح **${argresult}**`)
  return message.reply("** لا يمكنك تغيير تغيير آسم البوت الآن آلا بعد سآعتين **");
}
if (message.content.startsWith(PREFIX + 'setavatar')) {
  client.user.setAvatar(argresult);
   message.channel.sendMessage(`تم تغيير صورة البوت بنجآح **${argresult}**`);
}
});
client.login(process.env.BOT_TOKEN);
