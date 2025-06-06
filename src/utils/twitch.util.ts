import axios from 'axios'
import { TwitchStreamData } from '../interfaces/twitchConfig.interface.js'

export async function getTwitchAccessToken(clientId: string, clientSecret: string): Promise<string> {
    const response = await axios.post('https://id.twitch.tv/oauth2/token',  {
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: 'client_credentials',
    })

    return response.data.access_token
}

export async function getStreamData(streamerName: string, clientId: string, acessToken: string): Promise<TwitchStreamData | null>{
    try {
        const response = await axios.get(`https://api.twitch.tv/helix/streams?user_login=${streamerName}`, {
            headers:{
                'Client-ID': clientId,
                'Authorization': `Bearer ${acessToken}`,
            }
        })

        if (response.data.data && response.data.data.length > 0){
            return response.data.data[0] as TwitchStreamData
        }

        return null
    } catch (error) {
        console.error('Erro ao verificar a stream da twitch: ', error)
        return null
    }
}

export async function getUserInfo(streamNme: string, clientId: string, accessToken: string){
    try {
        const response = await axios.get(`https://api.twitch.tv/helix/users?login=${streamNme}`, {
            headers:{
                'CLient-ID': clientId,
                'Authorization': `Bearer ${accessToken}`,
            }
        })
        return response.data.data[0] || null
    } catch (error){
        console.error('Erro ao buscar dados do usuário:', error)
        return null
    }
}