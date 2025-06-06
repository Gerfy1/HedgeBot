export interface TwitchConfig{
    enabled:boolean
    streamer_name: string
    client_id: string
    client_secret: string
    access_token?: string
    check_interval: number
    last_check: number
    is_live: boolean
    target_group?:string
}

export interface TwitchStreamData{
    id: string
    user_id: string
    user_login: string
    user_name: string
    game_id: string
    game_name: string
    type: string
    tittle: string
    viewer_count: number
    started_at: string
    thumbnail_url: string
}