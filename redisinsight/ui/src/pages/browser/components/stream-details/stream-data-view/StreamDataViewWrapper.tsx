import { EuiText, EuiToolTip } from '@elastic/eui'
import React, { useCallback, useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { last, mergeWith, toNumber } from 'lodash'
import { RedisResponseBuffer } from 'uiSrc/slices/interfaces'

import {
  createDeleteFieldHeader,
  createDeleteFieldMessage,
  formatLongName,
  formattingBuffer,
  stringToBuffer
} from 'uiSrc/utils'
import { streamDataSelector, deleteStreamEntry } from 'uiSrc/slices/browser/stream'
import { ITableColumn } from 'uiSrc/components/virtual-table/interfaces'
import PopoverDelete from 'uiSrc/pages/browser/components/popover-delete/PopoverDelete'
import { getFormatTime } from 'uiSrc/utils/streamUtils'
import { KeyTypes, TableCellTextAlignment } from 'uiSrc/constants'
import { getBasedOnViewTypeEvent, sendEventTelemetry, TelemetryEvent } from 'uiSrc/telemetry'
import { connectedInstanceSelector } from 'uiSrc/slices/instances/instances'
import { keysSelector, selectedKeySelector, updateSelectedKeyRefreshTime } from 'uiSrc/slices/browser/keys'
import bufferToString from 'uiSrc/utils/formatters/bufferFormatters'

import { StreamEntryDto } from 'apiSrc/modules/browser/dto/stream.dto'
import StreamDataView from './StreamDataView'
import styles from './StreamDataView/styles.module.scss'

const suffix = '_stream'
const actionsWidth = 50
const minColumnWidth = 190

export interface Props {
  isFooterOpen: boolean
  loadMoreItems: () => void
}

const StreamDataViewWrapper = (props: Props) => {
  const {
    entries: loadedEntries = [],
    keyName: key,
    keyNameString: keyString,
    lastRefreshTime,
  } = useSelector(streamDataSelector)
  const { id: instanceId } = useSelector(connectedInstanceSelector)
  const { viewType: browserViewType } = useSelector(keysSelector)
  const { viewFormat: viewFormatProp } = useSelector(selectedKeySelector)

  const dispatch = useDispatch()

  // for Manager columns
  // const [uniqFields, setUniqFields] = useState({})
  const [entries, setEntries] = useState<StreamEntryDto[]>([])
  const [columns, setColumns] = useState<ITableColumn[]>([])
  const [deleting, setDeleting] = useState<string>('')
  const [viewFormat, setViewFormat] = useState(viewFormatProp)

  useEffect(() => {
    dispatch(updateSelectedKeyRefreshTime(lastRefreshTime))
  }, [])

  useEffect(() => {
    const fieldsNames: { [key: string]: { index: number, name: RedisResponseBuffer } } = {}

    const streamEntries = loadedEntries?.map((entry) => {
      const namesInEntry: { [key: string]: { index: number, name: RedisResponseBuffer } } = {}
      const entryFields = entry.fields.map((field) => {
        const { name } = field
        const nameViewValue = bufferToString(name, viewFormat)

        namesInEntry[nameViewValue] = {
          index: namesInEntry[nameViewValue] ? namesInEntry[nameViewValue].index + 1 : 1,
          name
        }

        return formatItem(field)
      })

      const mergeByCount = (accCount: number, newCount: number) => (newCount > accCount ? newCount : accCount)

      mergeWith(fieldsNames, namesInEntry, mergeByCount)
      return {
        ...entry,
        fields: entryFields
      }
    })

    const columnsNames = Object.keys(fieldsNames).reduce((acc, field) => {
      let names = {}
      // add index to each field name
      const { index, name } = fieldsNames[field] || {}
      for (let i = 0; i < index; i++) {
        names = {
          ...names,
          [`${field}-${i}`]: {
            id: field,
            label: field,
            render: () => {
              const { value: formattedValue } = formattingBuffer(name || stringToBuffer(''), viewFormatProp)
              return formattedValue || (<div>&nbsp;</div>)
            }
          }
        }
      }
      return { ...acc, ...names }
    }, {})

    // for Manager columns
    // setUniqFields(fields)
    const headerRow = {
      id: {
        id: 'id',
        label: 'Entry ID',
        sortable: true
      },
      ...columnsNames,
      actions: '',
    }
    setEntries([headerRow, ...streamEntries])
    setColumns([
      idColumn,
      ...Object.keys(columnsNames).map((field) => getTemplateColumn(field, columnsNames[field]?.id)),
      actionsColumn
    ])

    if (viewFormat !== viewFormatProp) {
      setViewFormat(viewFormatProp)
    }
  }, [loadedEntries, deleting, viewFormatProp])

  const closePopover = useCallback(() => {
    setDeleting('')
  }, [])

  const showPopover = useCallback((entry = '') => {
    setDeleting(`${entry + suffix}`)
  }, [])

  const formatItem = useCallback((field) => ({
    name: field.name,
    value: field.value,
  }), [viewFormatProp])

  const onSuccessRemoved = () => {
    sendEventTelemetry({
      event: getBasedOnViewTypeEvent(
        browserViewType,
        TelemetryEvent.BROWSER_KEY_VALUE_REMOVED,
        TelemetryEvent.TREE_VIEW_KEY_VALUE_REMOVED
      ),
      eventData: {
        databaseId: instanceId,
        keyType: KeyTypes.Stream,
        numberOfRemoved: 1,
      }
    })
  }

  const handleDeleteEntry = (entryId = '') => {
    dispatch(deleteStreamEntry(key, [entryId], onSuccessRemoved))
    closePopover()
  }

  const handleRemoveIconClick = () => {
    sendEventTelemetry({
      event: getBasedOnViewTypeEvent(
        browserViewType,
        TelemetryEvent.BROWSER_KEY_VALUE_REMOVE_CLICKED,
        TelemetryEvent.TREE_VIEW_KEY_VALUE_REMOVE_CLICKED
      ),
      eventData: {
        databaseId: instanceId,
        keyType: KeyTypes.Stream
      }
    })
  }

  const getTemplateColumn = (label: string, name: string) : ITableColumn => ({
    id: label,
    label: name,
    minWidth: minColumnWidth,
    isSortable: false,
    className: styles.cell,
    headerClassName: 'streamItemHeader',
    headerCellClassName: 'truncateText',
    render: function Id({ id, fields }: StreamEntryDto, expanded: boolean) {
      const index = toNumber(last(label.split('-')))
      const values = fields.filter(({ name: fieldName }) => bufferToString(fieldName, viewFormat) === name)
      const value = values[index] ? bufferToString(values[index]?.value) : ''

      const bufferValue = values[index]?.value || stringToBuffer('')
      const { value: formattedValue, isValid } = formattingBuffer(bufferValue, viewFormatProp, { expanded })
      const cellContent = formattedValue.substring?.(0, 650) ?? formattedValue
      const tooltipContent = formatLongName(value)

      return (
        <EuiText size="s" style={{ maxWidth: '100%', minHeight: '36px' }}>
          <div
            style={{ display: 'flex', whiteSpace: 'break-spaces' }}
            className="streamItem"
            data-testid={`stream-entry-field-${id}`}
          >
            {!expanded && (
              <EuiToolTip
                title={isValid ? 'Value' : `Failed to convert to ${viewFormatProp}`}
                className={styles.tooltip}
                anchorClassName="streamItem line-clamp-2"
                position="bottom"
                content={tooltipContent}
              >
                <>{cellContent}</>
              </EuiToolTip>
            )}
            {expanded && formattedValue}
          </div>
        </EuiText>
      )
    }
  })

  const idColumn: ITableColumn = {
    id: 'id',
    label: 'Entry ID',
    maxWidth: minColumnWidth,
    minWidth: minColumnWidth,
    isSortable: true,
    className: styles.cell,
    headerClassName: 'streamItemHeader',
    render: function Id({ id }: StreamEntryDto) {
      const idStr = bufferToString(id, viewFormat)
      const timestamp = idStr.split('-')?.[0]
      return (
        <div>
          <EuiText color="subdued" size="s" style={{ maxWidth: '100%' }}>
            <div className="streamItem truncateText" style={{ display: 'flex' }} data-testid={`stream-entry-${id}-date`}>
              {getFormatTime(timestamp)}
            </div>
          </EuiText>
          <EuiText size="s" style={{ maxWidth: '100%' }}>
            <div className="streamItemId" data-testid={`stream-entry-${id}`}>
              {id}
            </div>
          </EuiText>
        </div>
      )
    },
  }
  const actionsColumn: ITableColumn = {
    id: 'actions',
    label: '',
    headerClassName: styles.actionsHeader,
    textAlignment: TableCellTextAlignment.Left,
    absoluteWidth: actionsWidth,
    maxWidth: actionsWidth,
    minWidth: actionsWidth,
    render: function Actions({ id }: StreamEntryDto) {
      return (
        <div>
          <PopoverDelete
            header={createDeleteFieldHeader(id)}
            text={createDeleteFieldMessage(keyString)}
            item={id}
            suffix={suffix}
            deleting={deleting}
            closePopover={closePopover}
            updateLoading={false}
            showPopover={showPopover}
            testid={`remove-entry-button-${id}`}
            handleDeleteItem={handleDeleteEntry}
            handleButtonClick={handleRemoveIconClick}
          />
        </div>
      )
    },
  }

  return (
    <>
      <StreamDataView
        data={entries}
        columns={columns}
        onClosePopover={closePopover}
        {...props}
      />
    </>
  )
}

export default StreamDataViewWrapper
