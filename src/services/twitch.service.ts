import { TwitchConfig } from "../interfaces/twitchConfig.interface.js";
import path from "node:path";
import fs from "fs-extra";

export class TwitchService {
    private pathJSON = path.resolve("./storage/twitch.json")

    private defaultConfig: TwitchConfig = {
        enabled: false,
        streamer_name: "",
        client_id: "",
        client_secret: "",
        check_interval: 2,
        last_check: 0,
        is_live: false,
    }

    constructor(){
        const storageFolderExists = fs.pathExistsSync(path.resolve("storage"))
        const jsonFileExists = fs.existsSync(this.pathJSON)

        if(!storageFolderExists) fs.mkdirSync(path.resolve("storage"), {recursive: true})
        if(!jsonFileExists) this.initConfig()
    }

    private initConfig(){
        this.updateConfig(this.defaultConfig)
    }

    private updateConfig(config: TwitchConfig){
        fs.writeJSONSync(this.pathJSON, config, {spaces: 2})
    }

    public getConfig(): TwitchConfig{
        return fs.readJSONSync(this.pathJSON)
    }

    public setEnabled(enabled: boolean){
        const config = this.getConfig()
        config.enabled = enabled
        this.updateConfig(config)
    }

    public setStreamer(streamerName: string){
        const config = this.getConfig()
        config.streamer_name = streamerName
        this.updateConfig(config)
    }

    public setCredentials(clientId: string, clientSecret: string){
        const config = this.getConfig()
        config.client_id = clientId
        config.client_secret = clientSecret
        this.updateConfig(config)
    }

    public setTargetGroup(groupId: string){
        const config = this.getConfig()
        config.target_group = groupId
        this.updateConfig(config)
    }

    public setAccessToken(token: string){
        const config = this.getConfig()
        config.access_token = token
        this.updateConfig(config)
    }
    public setLiveStatus(isLive: boolean){
        const config = this.getConfig()
        config.is_live = isLive
        config.last_check = Date.now()
        this.updateConfig(config)
    }

    public setCheckInterval(minutes: number){
        const config = this.getConfig()
        config.check_interval = minutes
        this.updateConfig(config)
    }
}
