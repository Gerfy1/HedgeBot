import { TwitchService } from "../services/twitch.service.js";

export class TwitchController {
    private twitchService: TwitchService

    constructor(){
        this.twitchService = new TwitchService()
    }

    public getConfig(){
        return this.twitchService.getConfig()
    }

    public setEnabled(enabled: boolean){
        return this.twitchService.setEnabled(enabled)
    }

    public setStreamer(streamerName: string){
        return this.twitchService.setStreamer(streamerName)
    }

    public setCredentials(clientId: string, clientSecret: string){
        return this.twitchService.setCredentials(clientId, clientSecret)
    }
    public setTargetGroup(groupId: string){
        return this.twitchService.setTargetGroup(groupId)
    }

    public setAccessToken(accessToken: string){
        return this.twitchService.setAccessToken(accessToken)
    }

    public setLiveStatus(isLive: boolean){
        return this.twitchService.setLiveStatus(isLive)
    }

    public setCheckInterval(minutes: number){
        return this.twitchService.setCheckInterval(minutes)
    }

}