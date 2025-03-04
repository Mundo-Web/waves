
import React, { useRef, useState } from 'react'
import { createRoot } from 'react-dom/client'
import CreateReactScript from './Utils/CreateReactScript.jsx'
import ReactAppend from './Utils/ReactAppend.jsx'
import SetSelectValue from './Utils/SetSelectValue.jsx'
import Adminto from './components/Adminto.jsx'
import Table from './components/Table.jsx'
import TippyButton from './components/form/TippyButton.jsx'
import DxPanelButton from './components/dx/DxPanelButton.jsx'
import HistoriesRest from './actions/HistoriesRest.js'
import { renderToString } from 'react-dom/server'

const historiesRest = new HistoriesRest()

const Histories = () => {
  const gridRef = useRef()
  const modalRef = useRef()

  // Form elements ref
  const idRef = useRef()
  const nameRef = useRef()
  const tableRef = useRef()
  const descriptionRef = useRef()

  const [isEditing, setIsEditing] = useState(false)

  const onModalOpen = (data) => {
    if (data?.id) setIsEditing(true)
    else setIsEditing(false)

    idRef.current.value = data?.id || null
    SetSelectValue(tableRef.current, data?.table?.id, data?.table?.name)
    nameRef.current.value = data?.name || null
    descriptionRef.current.value = data?.description || null

    $(modalRef.current).modal('show')
  }

  const onModalSubmit = async (e) => {
    e.preventDefault()

    const request = {
      id: idRef.current.value || undefined,
      table_id: tableRef.current.value,
      name: nameRef.current.value,
      description: descriptionRef.current.value,
    }

    const result = await historiesRest.save(request)
    if (!result) return

    $(gridRef.current).dxDataGrid('instance').refresh()
    $(modalRef.current).modal('hide')
  }

  const onStatusChange = async ({ id, status }) => {
    const result = await historiesRest.status({ id, status })
    if (!result) return
    $(gridRef.current).dxDataGrid('instance').refresh()
  }

  const onDeleteClicked = async (id) => {
    const result = await historiesRest.delete(id)
    if (!result) return
    $(gridRef.current).dxDataGrid('instance').refresh()
  }

  const onReSendClicked = async (id) => {
    const result = await historiesRest.reSend(id)
    if (!result) return
    $(gridRef.current).dxDataGrid('instance').refresh()
  }

  return (<>
    <Table gridRef={gridRef} title={<h4 className='header-title my-0'>Historial de envios</h4>} rest={historiesRest}
      toolBar={(container) => {
        container.unshift(DxPanelButton({
          className: 'btn btn-xs btn-soft-dark',
          text: 'Actualizar',
          title: 'Refrescar tabla',
          icon: 'fas fa-undo-alt',
          onClick: () => $(gridRef.current).dxDataGrid('instance').refresh()
        }))
        container.unshift(DxPanelButton({
          className: 'btn btn-xs btn-soft-primary',
          text: 'Nuevo',
          title: 'Agregar registro',
          icon: 'fa fa-plus',
          onClick: () => onOpenModal()
        }))
      }}
      columns={[
        {
          dataField: 'created_at',
          dataType: 'datetime',
          caption: 'Fecha',
          width: '160px',
          sortOrder: 'desc'
        },
        {
          dataField: 'type',
          caption: 'Tipo',
          cellTemplate: (container, { value }) => {
            if (value == 'WhatsApp') {
              ReactAppend(container, <>
                <i className='mdi mdi-whatsapp me-1'></i>
                {value}
              </>)
            } else {
              ReactAppend(container, <>
                <i className='mdi mdi-email me-1'></i>
                {value}
              </>)
            }
          }
        },
        {
          dataField: 'name',
          caption: 'Plantilla'
        },
        {
          dataField: 'completed',
          caption: 'Completados',
          dataType: 'number',
          width: '80px',
          cellTemplate: (container, { value }) => {
            container.html(renderToString(<b className='text-success'>{value}</b>))
          }
        },
        {
          dataField: 'failed',
          caption: 'Fallidos',
          dataType: 'number',
          width: '80px',
          cellTemplate: (container, { value }) => {
            container.html(renderToString(<b className='text-danger'>{value}</b>))
          }
        },
        {
          dataField: 'total',
          caption: 'Total',
          dataType: 'number',
          width: '80px',
          cellTemplate: (container, { value }) => {
            container.html(renderToString(<b className='text-primary'>{value}</b>))
          }
        },
        {
          dataField: 'status',
          caption: 'Estado',
          dataType: 'boolean',
          width: '140px',
          cellTemplate: (container, { data }) => {
            if (data.status === 1) ReactAppend(container, <>
              <i className='mdi mdi-check me-1'></i>
              <span>Terminado</span>
            </>)
            if (data.status === 0) ReactAppend(container, <>
              <i className='mdi mdi-spin mdi-autorenew me-1'></i>
              <span>En curso</span>
            </>)
            if (data.status === null) ReactAppend(container, <>
              <i className='mdi mdi-clock me-1'></i>
              <span>Pendiente</span>
            </>)
          },
          lookup: {
            dataSource: [
              { key: 1, value: 'Completado' },
              { key: 0, value: 'Enviando' },
              { key: null, value: 'Pendiente' }
            ],
            valueExpr: 'key',
            displayExpr: 'value'
          }
        },
        {
          caption: 'Acciones',
          width: '130px',
          cellTemplate: (container, { data }) => {
            container.attr('style', 'display: flex; gap: 4px; overflow: unset')

            if (data.status === null) ReactAppend(container, <TippyButton className='btn btn-xs btn-soft-primary' title='Reintentar envio' onClick={() => onReSendClicked(data.id)}>
              <i className='mdi mdi-reload'></i>
            </TippyButton>)

            ReactAppend(container, <TippyButton className='btn btn-xs btn-soft-dark' title='Ver detalles de envio' onClick={() => console.log('hola')}>
              <i className='mdi mdi-format-list-bulleted-type'></i>
            </TippyButton>)
          },
          allowFiltering: false,
          allowExporting: false
        }
      ]} />
  </>
  )
};

CreateReactScript((el, properties) => {
  createRoot(el).render(
    <Adminto {...properties} title='Historial de envios'>
      <Histories {...properties} />
    </Adminto>
  );
})