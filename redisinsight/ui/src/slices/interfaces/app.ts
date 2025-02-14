import { AxiosError } from 'axios'
import { Nullable } from 'uiSrc/utils'
import { GetServerInfoResponse } from 'apiSrc/dto/server.dto'
import { ICommands } from 'uiSrc/constants'
import { IKeyPropTypes } from 'uiSrc/constants/prop-types/keys'

export interface IError extends AxiosError {
  id: string
  instanceId?: string
}

export interface IMessage {
  id: string
  title: string
  message: string
  group?: string
}

export interface StateAppInfo {
  loading: boolean
  error: string
  server: Nullable<GetServerInfoResponse>
  encoding: RedisResponseEncoding,
  analytics: {
    segmentWriteKey: string
    identified: boolean
  }
  electron: {
    isUpdateAvailable: Nullable<boolean>
    updateDownloadedVersion: string
    isReleaseNotesViewed: Nullable<boolean>
  }
  isShortcutsFlyoutOpen: boolean
}

export interface StateAppContext {
  contextInstanceId: string
  lastPage: string
  browser: {
    keyList: {
      isDataLoaded: boolean
      scrollTopPosition: number
      selectedKey: Nullable<RedisResponseBuffer>
    },
    panelSizes: {
      [key: string]: number
    },
    tree: {
      delimiter: string
      panelSizes: {
        [key: string]: number
      },
      openNodes: {
        [key: string]: boolean
      },
      selectedLeaf: {
        [key: string]: {
          [key: string]: IKeyPropTypes
        }
      },
    },
    bulkActions: {
      opened: boolean
    }
  },
  workbench: {
    script: string
    enablementArea: {
      itemPath: string
      itemScrollTop: number
    },
    panelSizes: {
      vertical: {
        [key: string]: number
      }
    }
  },
  pubsub: {
    channel: string
    message: string
  }
}

export interface StateAppRedisCommands {
  loading: boolean
  error: string
  spec: ICommands
  commandsArray: string[]
  commandGroups: string[]
}

export interface IPluginVisualization {
  id: string
  uniqId: string
  name: string
  plugin: any
  activationMethod: string
  matchCommands: string[]
  default?: boolean
  iconDark?: string
  iconLight?: string
}

export interface PluginsResponse {
  static: string
  plugins: IPlugin[]
}
export interface IPlugin {
  name: string
  main: string
  styles: string | string[]
  baseUrl: string
  visualizations: any[]
  internal?: boolean
}

export interface StateAppPlugins {
  loading: boolean
  error: string
  staticPath: string
  plugins: IPlugin[]
  visualizations: IPluginVisualization[]
}

export interface StateAppSocketConnection {
  isConnected: boolean
}

export enum NotificationType {
  Global = 'global'
}

export interface IGlobalNotification {
  type: string
  timestamp: number
  title: string
  body: string
  read: boolean
  category?: string
  categoryColor?: string
}

export interface StateAppNotifications {
  errors: IError[]
  messages: IMessage[]
  notificationCenter: {
    loading: boolean
    lastReceivedNotification: Nullable<IGlobalNotification>
    notifications: IGlobalNotification[]
    isNotificationOpen: boolean
    isCenterOpen: boolean
    totalUnread: number
    shouldDisplayToast: boolean
  }
}

export enum RedisResponseEncoding {
  UTF8 = 'utf8',
  ASCII = 'ascii',
  Buffer = 'buffer',
}

export enum RedisResponseBufferType {
  Buffer = 'Buffer'
}

export interface RedisResponseBuffer {
  type: RedisResponseBufferType
  data: UintArray
}

export type RedisString = string | RedisResponseBuffer

export type UintArray = number[] | Uint8Array
