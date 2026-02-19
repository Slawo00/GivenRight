const Discord = require('discord.js');
const { joinVoiceChannel, createAudioPlayer, createAudioResource, VoiceConnectionStatus } = require('@discordjs/voice');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

class DiscordVoiceBot {
    constructor() {
        this.client = new Discord.Client({
            intents: [
                Discord.GatewayIntentBits.Guilds,
                Discord.GatewayIntentBits.GuildVoiceStates,
                Discord.GatewayIntentBits.GuildMessages,
                Discord.GatewayIntentBits.MessageContent
            ]
        });
        
        this.setupBot();
    }
    
    setupBot() {
        this.client.once('ready', () => {
            console.log('🛡️ Aegis Voice Bot is ready!');
            console.log('Invite link will be generated...');
        });
        
        this.client.on('messageCreate', async (message) => {
            if (message.author.bot) return;
            
            if (message.content === '!join') {
                await this.joinVoiceChannel(message);
            }
            
            if (message.content === '!leave') {
                await this.leaveVoiceChannel(message);
            }
            
            if (message.content.startsWith('!speak ')) {
                const text = message.content.slice(7);
                await this.speakText(text, message);
            }
        });
    }
    
    async joinVoiceChannel(message) {
        const voiceChannel = message.member.voice.channel;
        
        if (!voiceChannel) {
            return message.reply('Du musst erst einem Voice Channel beitreten!');
        }
        
        try {
            const connection = joinVoiceChannel({
                channelId: voiceChannel.id,
                guildId: message.guild.id,
                adapterCreator: message.guild.voiceAdapterCreator,
            });
            
            connection.on(VoiceConnectionStatus.Ready, () => {
                console.log('Connected to voice channel!');
                message.reply('🎤 Ich bin jetzt im Voice Channel! Nutze `!speak <text>` um mit mir zu sprechen.');
            });
            
            this.connection = connection;
            this.player = createAudioPlayer();
            connection.subscribe(this.player);
            
        } catch (error) {
            console.error('Error joining voice channel:', error);
            message.reply('❌ Fehler beim Beitreten des Voice Channels.');
        }
    }
    
    async leaveVoiceChannel(message) {
        if (this.connection) {
            this.connection.destroy();
            this.connection = null;
            message.reply('👋 Habe den Voice Channel verlassen.');
        }
    }
    
    async speakText(text, message) {
        if (!this.connection) {
            return message.reply('Ich bin nicht in einem Voice Channel. Nutze `!join` erst.');
        }
        
        try {
            // Generate speech using espeak (fallback)
            const audioFile = await this.generateSpeech(text);
            
            // Play audio in Discord
            const resource = createAudioResource(audioFile);
            this.player.play(resource);
            
            message.react('🎤');
            
        } catch (error) {
            console.error('Error speaking text:', error);
            message.reply('❌ Fehler beim Generieren der Sprache.');
        }
    }
    
    async generateSpeech(text) {
        return new Promise((resolve, reject) => {
            const outputFile = `/tmp/discord-speech-${Date.now()}.wav`;
            
            // Use espeak with optimized settings for Discord
            const espeak = spawn('espeak', [
                '-v', 'de+f3',
                '-s', '130',
                '-p', '38',
                '-a', '130',
                '-g', '3',
                '-w', outputFile,
                text
            ]);
            
            espeak.on('close', (code) => {
                if (code === 0) {
                    resolve(outputFile);
                } else {
                    reject(new Error('Speech generation failed'));
                }
            });
            
            espeak.on('error', reject);
        });
    }
    
    async start(token) {
        try {
            await this.client.login(token);
        } catch (error) {
            console.error('Failed to start bot:', error);
        }
    }
}

module.exports = DiscordVoiceBot;

// Usage example (needs Discord bot token)
if (require.main === module) {
    console.log('Discord Voice Bot setup ready.');
    console.log('Need Discord bot token to start...');
}