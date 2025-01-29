
import React, { useRef, useState } from 'react'
import { createRoot } from 'react-dom/client'
import CreateReactScript from './Utils/CreateReactScript.jsx'
import SettingsRest from './actions/SettingsRest.js'
import Adminto from './components/Adminto.jsx'
import Modal from './components/Modal.jsx'
import QuillFormGroup from './components/form/QuillFormGroup.jsx'
import '../css/settings.css'
import '../css/coming-soon.css'
import SelectFormGroup from './components/form/SelectFormGroup.jsx'
import { Editor } from '@tinymce/tinymce-react'
import TextareaFormGroup from './components/form/TextareaFormGroup.jsx'

const settingsRest = new SettingsRest()

const Settings = ({ can, constants, statuses }) => {

  const modalRef = useRef()
  // Form elements ref
  const typeRef = useRef()
  const nameRef = useRef()
  const valueRef = useRef()
  const quillRef = useRef()
  const tinyRef = useRef()

  const [constantType, setConstantType] = useState()

  const onModalOpen = (e, name, title, type) => {
    const constant = getConstant(name)
    setConstantType(type)

    nameRef.current.value = name
    typeRef.current.value = type

    switch (type) {
      case 'simpleHTML':
        quillRef.editor.root.innerHTML = constant.value
        break;
      case 'HTML':
        tinyRef.current.setContent(constant.value)
        break;
      default:
        valueRef.current.value = constant.value
        break;
    }
    $(modalRef.current).find('.modal-title').text(title)
    $(modalRef.current).modal('show')
  }

  const onModalSubmit = async (e) => {
    e.preventDefault()

    let value = valueRef.current.value
    switch (constantType) {
      case 'simpleHTML':
        value = quillRef.editor.root.innerHTML
        break;
      case 'HTML':
        value = tinyRef.current.getContent()
        break;
    }

    const request = {
      type: typeRef.current.value,
      name: nameRef.current.value,
      value,
    }

    const result = await settingsRest.save(request)
    if (!result) return

    $(modalRef.current).modal('hide')
    location.reload()
  }

  const getConstant = (constantName) => {
    const constant = constants.find(({ name }) => name == constantName)
    if (!constant) return {
      name: constantName,
      value: null
    }
    return constant
  }

  const constantStatusRef = useRef()
  const leadStatusRef = useRef()
  const manageStatusRef = useRef()
  const taskStatusRef = useRef()
  const leadStatusModal = useRef()

  const onAsignationStatusClicked = () => {
    const constant = getConstant('assignation-lead-status')
    const value = JSON.parse(constant.value)

    $(leadStatusModal.current).find('.modal-title').text('Estados de asignacion')
    constantStatusRef.current.value = 'assignation-lead-status'
    $(leadStatusRef.current).val(value?.lead).trigger('change')
    $(manageStatusRef.current).val(value?.manage).trigger('change')
    $(taskStatusRef.current).val(value?.task).trigger('change')

    $(leadStatusModal.current).modal('show')
  }

  const onRevertionStatusClicked = () => {
    const constant = getConstant('revertion-lead-status')
    const value = JSON.parse(constant.value)

    $(leadStatusModal.current).find('.modal-title').text('Estados de reversion')
    constantStatusRef.current.value = 'revertion-lead-status'
    $(leadStatusRef.current).val(value?.lead).trigger('change')
    $(manageStatusRef.current).val(value?.manage).trigger('change')
    $(taskStatusRef.current).val(value?.task).trigger('change')

    $(leadStatusModal.current).modal('show')
  }

  const onLeadStatusSubmit = async (e) => {
    e.preventDefault()

    const value = {
      lead: leadStatusRef.current.value,
      manage: manageStatusRef.current.value,
      task: taskStatusRef.current.value,
    }

    const request = {
      name: constantStatusRef.current.value,
      value: JSON.stringify(value),
      type: 'json'
    }

    const result = await settingsRest.save(request)
    if (!result) return

    $(modalRef.current).modal('hide')
    location.reload()
  }

  return (<>
    <div className="row" >
      <div className="col-12">
        <div className="card" style={{ minHeight: 'calc(100vh - 160px)' }}>
          <div className="card-header">
            <h4 className="header-title mb-0">Configura aqui las constantes del sistema</h4>
          </div>
          <div className="card-body">
            <div className="row">
              <div className="col-sm-3 mb-2">
                <div className="nav flex-column nav-pills nav-pills-tab" id="v-pills-tab" role="tablist" aria-orientation="vertical">
                  <a className="nav-link active show mb-1" id="v-general-tab" data-bs-toggle="pill" href="#v-general" role="tab" aria-controls="v-general" aria-selected="true">
                    General
                  </a>
                  <a className="nav-link mb-1" id="v-clients-leads-tab" data-bs-toggle="pill" href="#v-clients-leads" role="tab" aria-controls="v-clients-leads" aria-selected="false">
                    Clientes y leads
                  </a>
                  <a className="nav-link mb-1" id="v-email-tab" data-bs-toggle="pill" href="#v-email" role="tab" aria-controls="v-email" aria-selected="false">
                    Correo
                  </a>
                  <a className="nav-link mb-1" id="v-whatsapp-tab" data-bs-toggle="pill" href="#v-whatsapp" role="tab" aria-controls="v-whatsapp" aria-selected="false">
                    WhatsApp
                  </a>
                  <a className="nav-link mb-1" id="v-generativeai-tab" data-bs-toggle="pill" href="#v-generativeai" role="tab" aria-controls="v-generativeai" aria-selected="false">
                    IA <i className='mdi mdi-star-four-points'></i>
                  </a>
                </div>
              </div>
              <div className="col-sm-9">
                <div className="tab-content pt-0">
                  <div className="tab-pane fade active show coming-soon" id="v-general" role="tabpanel" aria-labelledby="v-general-tab">
                    <h4>Configuracion general</h4>
                    <div className="row">
                      <div className="col-md-4 col-sm-6 col-xs-12">
                        <div className="card card-body border p-2">
                          <h5 className="card-title mb-1">Que julio no vea esto</h5>
                          <p className="card-text mb-1">Si lo ves, aun esta en implementacion, pero quiero que vaya quedando el diseño</p>
                          <p className="card-text">
                            <small className="text-muted">Atte. Manuel (el 9)</small>
                          </p>
                        </div>
                      </div>
                      <div className="col-md-4 col-sm-6 col-xs-12">
                        <div className="card card-body border p-2">
                          <h5 className="card-title mb-1">Que julio no vea esto</h5>
                          <p className="card-text mb-1">Si lo ves, aun esta en implementacion, pero quiero que vaya quedando el diseño</p>
                          <p className="card-text">
                            <small className="text-muted">Atte. Manuel (el 9)</small>
                          </p>
                        </div>
                      </div>
                      <div className="col-md-4 col-sm-6 col-xs-12">
                        <div className="card card-body border p-2">
                          <h5 className="card-title mb-1">Que julio no vea esto</h5>
                          <p className="card-text mb-1">Si lo ves, aun esta en implementacion, pero quiero que vaya quedando el diseño</p>
                          <p className="card-text">
                            <small className="text-muted">Atte. Manuel (el 9)</small>
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="tab-pane fade" id="v-clients-leads" role="tabpanel" aria-labelledby="v-clients-leads-tab">
                    <h4>Configuracion de clientes y leads</h4>
                    <div className="row">
                      <div className="col-md-4 col-sm-6 col-xs-12">
                        <div className="card card-body border p-2" onClick={onAsignationStatusClicked}>
                          <h5 className="card-title mb-1">Estados de asignacion</h5>
                          <p className="card-text mb-0">Cuales son los estados que asignan el usuario al cliente directamente?</p>
                        </div>
                      </div>
                      <div className="col-md-4 col-sm-6 col-xs-12">
                        <div className="card card-body border p-2" onClick={onRevertionStatusClicked}>
                          <h5 className="card-title mb-1">Estados de reversion</h5>
                          <p className="card-text mb-0">Cuales son los estados que quitan la asignacion del usuario directamente?</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="tab-pane fade coming-soon" id="v-email" role="tabpanel" aria-labelledby="v-email-tab">
                    <h4>Configuracion de correo</h4>
                    <div className="row">
                      <div className="col-md-4 col-sm-6 col-xs-12">
                        <div className="card card-body border p-2">
                          <h5 className="card-title mb-1">Credenciales</h5>
                          <p className="card-text mb-1">De donde saldran los mensajes de correo hacia los leads?</p>
                          <p className="card-text">
                            <small className="text-muted">Correo actual: mundoweb.pe</small>
                          </p>
                        </div>
                      </div>
                      <div className="col-md-4 col-sm-6 col-xs-12">
                        <div className="card card-body border p-2" onClick={() => { }}>
                          <h5 className="card-title mb-1">Diseño de correo para el lead</h5>
                          <p className="card-text mb-1">Que correo veran los nuevos leads cuando caigan al crm?</p>
                        </div>
                      </div>
                      <div className="col-md-4 col-sm-6 col-xs-12">
                        <div className="card card-body border p-2">
                          <h5 className="card-title mb-1">Correo administrador</h5>
                          <p className="card-text mb-1">A que correo deseas que te enviemos un mensaje cuando se registe un nuevo lead?</p>
                          <p className="card-text">
                            <small className="text-muted " style={{ wordWrap: 'wrap' }}>Correo actual: gamboapalominocarlosmanuel@gmail.com</small>
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="tab-pane fade" id="v-whatsapp" role="tabpanel" aria-labelledby="v-whatsapp-tab">
                    <h4>Configuracion de WhatsApp</h4>
                    <div className="row">
                      <div className="col-md-4 col-sm-6 col-xs-12">
                        <div className="card card-body border p-2" onClick={(e) => onModalOpen(e, 'whatsapp-new-lead-notification-message', 'Notificacion - Nuevo lead', 'simpleHTML')}>
                          <h5 className="card-title mb-1">Notificacion - Nuevo lead</h5>
                          <p className="card-text mb-1">Que mensaje llegara al grupo/persona encargado de revisar los leads?</p>
                          <p className="card-text">
                            <small className="text-muted">Click para modificar</small>
                          </p>
                        </div>
                      </div>
                      <div className="col-md-4 col-sm-6 col-xs-12">
                        <div className="card card-body border p-2" onClick={(e) => onModalOpen(e, 'whatsapp-new-lead-notification-waid', 'Grupo/Persona encargado', 'text')}>
                          <h5 className="card-title mb-1">Grupo/Persona encargado</h5>
                          <p className="card-text mb-1">A quien(es) debemos notificar cuando se registre un nuevo lead?</p>
                          <p className="card-text">
                            <small className="text-muted">Click para modificar</small>
                          </p>
                        </div>
                      </div>
                      <div className="col-md-4 col-sm-6 col-xs-12">
                        <div className="card card-body border p-2" onClick={(e) => onModalOpen(e, 'whatsapp-new-lead-notification-message-client', 'Notificacion al lead', 'simpleHTML')}>
                          <h5 className="card-title mb-1">Notificacion al lead</h5>
                          <p className="card-text mb-1">Que mensaje le llegara al lead cuando sea registrado en el sistema?</p>
                          <p className="card-text">
                            <small className="text-muted">Click para modificar</small>
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="tab-pane fade" id="v-generativeai" role="tabpanel" aria-labelledby="v-generativeai-tab">
                    <h4>IA <i className='mdi mdi-star-four-points'></i></h4>
                    <div className="row">
                      <div className="col-md-4 col-sm-6 col-xs-12">
                        <div className="card card-body border p-2" onClick={(e) => onModalOpen(e, 'gemini-api-key', 'API Key - Gemini', 'text')}>
                          <h5 className="card-title mb-1">API Key - Gemini</h5>
                          <p className="card-text mb-1">Configura un API key para que <b>Gemini</b> interactue con nuevos clientes.</p>
                          <p className="card-text">
                            <small className="text-muted">Click para modificar</small>
                          </p>
                        </div>
                      </div>
                      <div className="col-md-4 col-sm-6 col-xs-12">
                        <div className="card card-body border p-2" onClick={(e) => onModalOpen(e, 'gemini-what-business-do', 'Que hace tu empresa [Separado por comas]', 'text')}>
                          <h5 className="card-title mb-1">Que hace tu empresa</h5>
                          <p className="card-text mb-1">Ayuda a Gemini a saber que productos/servicios buscan los clientes en tu empresa</p>
                          <p className="card-text">
                            <small className="text-muted">Click para modificar</small>
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    {/* <Table gridRef={gridRef} title='Configuracion' defaultRows={defaultRows} rest={SettingsRest}
      toolBar={(container) => {
        container.unshift({
          widget: 'dxButton', location: 'after',
          options: {
            icon: 'refresh',
            hint: 'Refrescar tabla',
            onClick: () => $(gridRef.current).dxDataGrid('instance').refresh()
          }
        });
        // container.unshift({
        //   widget: 'dxButton', location: 'after',
        //   options: {
        //     icon: 'plus',
        //     hint: 'Nuevo registro',
        //     onClick: () => onModalOpen()
        //   }
        // });
      }}
      columns={[
        {
          dataField: 'id',
          caption: 'ID',
          visible: false
        },
        {
          dataField: 'name',
          caption: 'Nombre de configuracion'
        },
        {
          dataField: 'description',
          caption: 'Descripcion',
          cellTemplate: (container, { value }) => {
            if (!value) ReactAppend(container, <i className='text-muted'>- Sin descripcion -</i>)
            else ReactAppend(container, value)
          }
        },
        {
          caption: 'Acciones',
          cellTemplate: (container, { data }) => {
            can('settings', 'root', 'all', 'update') && ReactAppend(container, <TippyButton className='btn btn-xs btn-soft-primary' title='Editar' onClick={() => onModalOpen(data)}>
              <i className='fa fa-pen'></i>
            </TippyButton>)
          },
          allowFiltering: false,
          allowExporting: false
        }
      ]} /> */}
    <Modal modalRef={leadStatusModal} title='' onSubmit={onLeadStatusSubmit} size='sm'>
      <input ref={constantStatusRef} type="hidden" />
      <div className='row' id='assignation-status-container'>
        <SelectFormGroup eRef={leadStatusRef} label='Estado del lead' dropdownParent='#assignation-status-container' required >
          <option value>- Sin accion -</option>
          {statuses
            .filter(({ table_id }) => table_id == 'e05a43e5-b3a6-46ce-8d1f-381a73498f33')
            .sort((a, b) => a.order - b.order)
            .map((status, i) => {
              return <option key={`status-${i}`} value={status.id}>{status.name}</option>
            })}
        </SelectFormGroup>
        <SelectFormGroup eRef={manageStatusRef} label='Estado de gestion' dropdownParent='#assignation-status-container' required >
          <option value>- Sin accion -</option>
          {statuses
            .filter(({ table_id }) => table_id == '9c27e649-574a-47eb-82af-851c5d425434')
            .sort((a, b) => a.order - b.order)
            .map((status, i) => {
              return <option key={`status-${i}`} value={status.id}>{status.name}</option>
            })}
        </SelectFormGroup>
        <SelectFormGroup eRef={taskStatusRef} label='Estado de la tarea' dropdownParent='#assignation-status-container' required>
          <option value>- Sin accion -</option>
          <option value='Pendiente'>Pendiente</option>
          <option value='En curso'>En curso</option>
          <option value='Realizado'>Realizado</option>
        </SelectFormGroup>
      </div>
    </Modal>
    <Modal modalRef={modalRef} title='' onSubmit={onModalSubmit} size='md'>
      <div className='row' id='settings-crud-container'>
        <input ref={nameRef} type='hidden' />
        <input ref={typeRef} type='hidden' />
        <div style={{ display: (constantType == 'text' || constantType == '' || constantType == null) ? 'block' : 'none' }}>
          <TextareaFormGroup eRef={valueRef} label='Valor' col='col-12'  />
        </div>
        <div style={{ display: constantType == 'simpleHTML' ? 'block' : 'none' }}>
          <QuillFormGroup eRef={quillRef} label='Valor' col='col-12' theme='bubble'  />
        </div>
        <div className='col-12' style={{ display: constantType == 'HTML' ? 'block' : 'none' }}>
          <label htmlFor="">Valor de la variable</label>
          <Editor apiKey='k2389nfj5bxjbe7s3kkc3c6fututtaba9syfaviluaf2jew6'
            onInit={(_evt, editor) => tinyRef.current = editor}
            init={{
              height: 500,
              menubar: false,
              plugins: [
                'advlist', 'autolink', 'lists', 'link', 'image', 'charmap', 'preview',
                'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen',
                'insertdatetime', 'media', 'table', 'code', 'help', 'wordcount'
              ],
              toolbar: 'undo redo | blocks | ' +
                'bold italic forecolor | alignleft aligncenter ' +
                'alignright alignjustify | bullist numlist outdent indent | ' +
                'removeformat | help',
              content_style: 'body { font-family:Helvetica,Arial,sans-serif; font-size:14px }'
            }} />
        </div>
      </div>
    </Modal>
  </>
  )
};

CreateReactScript((el, properties) => {
  if (!properties.can('settings', 'root', 'all', 'list')) return location.href = '/';
  createRoot(el).render(
    <Adminto {...properties} title='Constantes de configuracion'>
      <Settings {...properties} />
    </Adminto>
  );
})